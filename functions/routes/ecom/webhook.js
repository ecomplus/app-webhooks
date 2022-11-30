const axios = require('axios')

// read configured E-Com Plus app data
const getAppData = require('./../../lib/store-api/get-app-data')

const SKIP_TRIGGER_NAME = 'SkipTrigger'
const ECHO_SUCCESS = 'SUCCESS'
const ECHO_SKIP = 'SKIP'
const ECHO_API_ERROR = 'STORE_API_ERR'

exports.post = ({ appSdk }, req, res) => {
  // receiving notification from Store API
  const { storeId } = req

  /**
   * Treat E-Com Plus trigger body here
   * Ref.: https://developers.e-com.plus/docs/api/#/store/triggers/
   */
  const trigger = req.body

  // get app configured options
  getAppData({ appSdk, storeId })

    .then(appData => {
      if (
        Array.isArray(appData.ignore_triggers) &&
        appData.ignore_triggers.indexOf(trigger.resource) > -1
      ) {
        // ignore current trigger
        const err = new Error()
        err.name = SKIP_TRIGGER_NAME
        throw err
      }

      /* DO YOUR CUSTOM STUFF HERE */
      const { resource } = trigger
      let orderId, manualQueue
      const updateManualQueue = () => {
        if (manualQueue) {
          appSdk.apiApp(storeId, 'data', 'PATCH', { manual_queue: manualQueue })
            .catch(console.error)
        }
      }
      if (resource === 'applications') {
        if (trigger.body && Array.isArray(trigger.body.manual_queue)) {
          manualQueue = trigger.body.manual_queue
          const nextId = manualQueue[0]
          if (typeof nextId === 'string' && /[a-f0-9]{24}/.test(nextId)) {
            orderId = nextId.trim()
          }
          manualQueue.shift()
        }
      } else if (resource === 'orders' && trigger.action !== 'delete') {
        orderId = trigger.resource_id || trigger.inserted_id
      }
      if (orderId) {
        const urls = []
        const webhooksPromises = []
        const addWebhook = (options) => {
          const url = options && options.webhook_uri
          if (url && !urls.includes(url)) {
            urls.push(url)
            console.log(`Trigger for Store #${storeId} ${orderId} => ${url}`)
            webhooksPromises.push(
              appSdk.apiRequest(storeId, `${resource}/${orderId}.json`).then(async ({ response }) => {
                const order = response.data
                if (
                  options.skip_pending === true &&
                  (!order.financial_status || order.financial_status.current === 'pending')
                ) {
                  return res.sendStatus(204)
                }
                console.log(`> Sending ${resource} notification`)
                const token = options.webhook_token
                let headers
                if (token) {
                  headers = {
                    'Authorization': `Bearer ${token}`
                  }
                }
                return axios({
                  method: 'post',
                  url,
                  headers,
                  data: {
                    storeId,
                    trigger,
                    order,
                  }
                })
              })
              .then(({ status }) => console.log(`> ${status}`))
              .catch(error => {
                if (error.response && error.config) {
                  const err = new Error(`#${storeId} ${orderId} POST to ${url} failed`)
                  const { status, data } = error.response
                  err.response = {
                    status,
                    data: JSON.stringify(data)
                  }
                  err.data = JSON.stringify(error.config.data)
                  return console.error(err)
                }
                console.error(error)
              })
            )
          }
        }
        const { webhooks } = appData
        if (Array.isArray(webhooks)) {
          webhooks.forEach(addWebhook)
        }
        addWebhook(appData)
        return Promise.all(webhooksPromises).then(() => {
          updateManualQueue()
          if (!res.headersSent) {
            return res.sendStatus(200)
          }
        })
      }
      updateManualQueue()
      res.sendStatus(204)
    })

    .catch(err => {
      if (err.name === SKIP_TRIGGER_NAME) {
        // trigger ignored by app configuration
        res.send(ECHO_SKIP)
      } else {
        // console.error(err)
        // request to Store API with error response
        // return error status code
        res.status(500)
        const { message } = err
        res.send({
          error: ECHO_API_ERROR,
          message
        })
      }
    })
}
