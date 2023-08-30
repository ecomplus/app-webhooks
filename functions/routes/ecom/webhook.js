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
      let docId, manualQueue, isCart
      const updateManualQueue = () => {
        if (manualQueue) {
          const data = { manual_queue: manualQueue }
          setTimeout(() => {
            appSdk.apiApp(storeId, 'data', 'PATCH', data).catch(console.error)
          }, 1000)
          manualQueue = null
        }
      }
      if (resource === 'applications') {
        const { body } = trigger
        if (body && Array.isArray(body.manual_queue) && body.manual_queue.length) {
          manualQueue = body.manual_queue
          const nextId = manualQueue[0]
          if (typeof nextId === 'string' && /[a-f0-9]{24}/.test(nextId)) {
            docId = nextId.trim()
          }
          manualQueue.shift()
        }
      } else if (trigger.action !== 'delete') {
        docId = trigger.resource_id || trigger.inserted_id
        isCart = resource === 'carts'
      }
      if (docId) {
        const docEndpoint = isCart ? `carts/${docId}.json` : `orders/${docId}.json`
        return appSdk.apiRequest(storeId, docEndpoint).then(async ({ response }) => {
          const doc = response.data
          let customer
          if (isCart) {
            if (doc.completed || doc.available === false) {
              return res.sendStatus(204)
            }
            const abandonedCartDelay = 1000 * 5
            if (Date.now() - new Date(doc.created_at).getTime() >= abandonedCartDelay) {
              const customerId = doc.customers && doc.customers[0]
              if (customerId) {
                const { response } = await appSdk.apiRequest(storeId, `customers/${customerId}.json`)
                customer = response.data
              }
            } else {
              return res.sendStatus(501)
            }
          }
          const urls = []
          const webhooksPromises = []
          const addWebhook = (options) => {
            const url = options && options.webhook_uri
            if (url && !urls.includes(url) && (!isCart || options.send_carts)) {
              urls.push(url)
              console.log(`Trigger for Store #${storeId} ${docEndpoint} => ${url}`)
              if (
                options.skip_pending === true &&
                (!doc.financial_status || doc.financial_status.current === 'pending')
              ) {
                return null
              }
              console.log(`> Sending ${resource} notification`)
              const token = options.webhook_token
              let headers
              if (token) {
                headers = {
                  'Authorization': `Bearer ${token}`
                }
              }
              webhooksPromises.push(
                axios({
                  method: 'post',
                  url,
                  headers,
                  data: {
                    storeId,
                    trigger,
                    [isCart ? 'cart' : 'order']: doc,
                    customer,
                  }
                })
                .then(({ status }) => {
                  updateManualQueue()
                  console.log(`> ${status}`)
                })
                .catch(error => {
                  if (error.response && error.config) {
                    const err = new Error(`#${storeId} ${docId} POST to ${error.config.url} failed`)
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
            if (!res.headersSent) {
              return res.sendStatus(200)
            }
          })
        }).catch(error => {
          console.error(error)
          const status = error.response
            ? error.response.status || 500 : 409
          return res.sendStatus(status)
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
