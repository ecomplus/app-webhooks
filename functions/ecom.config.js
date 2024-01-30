/* eslint-disable comma-dangle, no-multi-spaces, key-spacing */

/**
 * Edit base E-Com Plus Application object here.
 * Ref.: https://developers.e-com.plus/docs/api/#/store/applications/
 */

const app = {
  app_id: 123113,
  title: 'Webhooks',
  slug: 'webhooks',
  type: 'external',
  state: 'active',
  authentication: true,

  /**
   * Uncomment modules above to work with E-Com Plus Mods API on Storefront.
   * Ref.: https://developers.e-com.plus/modules-api/
   */
  modules: {
    /**
     * Triggered to calculate shipping options, must return values and deadlines.
     * Start editing `routes/ecom/modules/calculate-shipping.js`
     */
    // calculate_shipping:   { enabled: true },

    /**
     * Triggered to validate and apply discount value, must return discount and conditions.
     * Start editing `routes/ecom/modules/apply-discount.js`
     */
    // apply_discount:       { enabled: true },

    /**
     * Triggered when listing payments, must return available payment methods.
     * Start editing `routes/ecom/modules/list-payments.js`
     */
    // list_payments:        { enabled: true },

    /**
     * Triggered when order is being closed, must create payment transaction and return info.
     * Start editing `routes/ecom/modules/create-transaction.js`
     */
    // create_transaction:   { enabled: true },
  },

  /**
   * Uncomment only the resources/methods your app may need to consume through Store API.
   */
  auth_scope: {
    'stores/me': [
      'GET'            // Read store info
    ],
    procedures: [
      'POST'           // Create procedures to receive webhooks
    ],
    products: [
      // 'GET',           // Read products with public and private fields
      // 'POST',          // Create products
      // 'PATCH',         // Edit products
      // 'PUT',           // Overwrite products
      // 'DELETE',        // Delete products
    ],
    brands: [
      // 'GET',           // List/read brands with public and private fields
      // 'POST',          // Create brands
      // 'PATCH',         // Edit brands
      // 'PUT',           // Overwrite brands
      // 'DELETE',        // Delete brands
    ],
    categories: [
      // 'GET',           // List/read categories with public and private fields
      // 'POST',          // Create categories
      // 'PATCH',         // Edit categories
      // 'PUT',           // Overwrite categories
      // 'DELETE',        // Delete categories
    ],
    customers: [
      'GET',           // List/read customers
      // 'POST',          // Create customers
      // 'PATCH',         // Edit customers
      // 'PUT',           // Overwrite customers
      // 'DELETE',        // Delete customers
    ],
    orders: [
      'GET',           // List/read orders with public and private fields
      // 'POST',          // Create orders
      // 'PATCH',         // Edit orders
      // 'PUT',           // Overwrite orders
      // 'DELETE',        // Delete orders
    ],
    carts: [
      'GET',           // List all carts (no auth needed to read specific cart only)
      // 'POST',          // Create carts
      // 'PATCH',         // Edit carts
      // 'PUT',           // Overwrite carts
      // 'DELETE',        // Delete carts
    ],

    /**
     * Prefer using 'fulfillments' and 'payment_history' subresources to manipulate update order status.
     */
    'orders/fulfillments': [
      // 'GET',           // List/read order fulfillment and tracking events
      // 'POST',          // Create fulfillment event with new status
      // 'DELETE',        // Delete fulfillment event
    ],
    'orders/payments_history': [
      // 'GET',           // List/read order payments history events
      // 'POST',          // Create payments history entry with new status
      // 'DELETE',        // Delete payments history entry
    ],

    /**
     * Set above 'quantity' and 'price' subresources if you don't need access for full product document.
     * Stock and price management only.
     */
    'products/quantity': [
      // 'GET',           // Read product available quantity
      // 'PUT',           // Set product stock quantity
    ],
    'products/variations/quantity': [
      // 'GET',           // Read variaton available quantity
      // 'PUT',           // Set variation stock quantity
    ],
    'products/price': [
      // 'GET',           // Read product current sale price
      // 'PUT',           // Set product sale price
    ],
    'products/variations/price': [
      // 'GET',           // Read variation current sale price
      // 'PUT',           // Set variation sale price
    ],

    /**
     * You can also set any other valid resource/subresource combination.
     * Ref.: https://developers.e-com.plus/docs/api/#/store/
     */
  },

  admin_settings: {
    webhooks: {
      schema: {
        title: 'Webhooks',
        type: 'array',
        maxItems: 300,
        items: {
          title: 'Webhook',
          type: 'object',
          additionalProperties: false,
          properties: {
            webhook_uri: {
              type: 'string',
              maxLength: 255,
              format: 'uri',
              title: 'Webhook URI',
              description: 'URL de destino para os webhooks'
            },
            webhook_token: {
              type: 'string',
              maxLength: 50,
              title: 'Token',
              description: 'Bearer token opcional para o cabeçalho Authorization'
            },
            webhook_prop_token: {
              type: 'string',
              maxLength: 50,
              title: 'Parâmetro no header',
              description: 'Caso preenchido, será considerado esse parâmetro com token como valor e sem bearer token'
            },
            skip_pending: {
              type: 'boolean',
              default: false,
              title: 'Ignorar pedidos pendentes'
            },
            send_carts: {
              type: 'boolean',
              default: false,
              title: 'Enviar carrinhos abandonados'
            },
            send_customers: {
              type: 'boolean',
              default: false,
              title: 'Enviar clientes criados'
            }
          }
        }
      },
      hide: true
    },
    manual_queue: {
      schema: {
        title: 'Fila manual de disparos',
        type: 'array',
        maxItems: 3000,
        items: {
          title: 'ID do pedido',
          type: 'string',
          minLength: 24,
          maxLength: 24
        }
      },
      hide: false
    },
    map_prop: {
      schema: {
        title: 'Mapeamento de propriedades enviadas',
        type: 'array',
        maxItems: 90,
        items: {
          title: 'Relacionar informações enviada com propriedades de cada recurso',
          description: 'Escolha qual informação será enviada no POST do webhook',
          type: 'object',
          properties: {
            ecom_resource: {
              type: 'string',
              enum: [
                'Carrinho', 
                'Cliente',
                'Pedido'
              ],
              title: 'Tipo de Informação a ser enviada'
            },
            prop: {
              type: 'string',
              title: 'Nome da propriedade',
              description: 'O nome da propriedade deve ser exatamente igual ao que mostra na documentação http://developers.e-com.plus/docs/api/#/store'
            },
            new_prop: {
              type: 'string',
              title: 'Nome da nova propriedade',
              description: 'Será o nome da nova propriedade. Exemplo: Você precisa enviar no body o email com propriedade email, logo no nome da propriedade será main_email e neste campo email'
            },
            value: {
              type: 'string',
              title: 'Valor da propriedade inserida'
            },
            ecom_status: {
              type: 'string',
              enum: [
                'criar', 
                'editar',
                'deletar'
              ],
              title: 'Mostrar como valor para a propriedade, condicionado a um dos eventos',
              description: 'Exemplo: prop é criar_pedido, recurso é pedido, apenas propriedades desativado, caso seja marcado criar nesta opção, quando o pedido de fato for criado, além das propriedades anteriores, será inserido criar_pedido: true'
            },
            only: {
              type: 'boolean',
              title: 'Apenas as propriedades informadas aqui?',
              default: false,
              description: 'Caso ativo, será enviado apenas a propriedade informada neste bloco, caso contrário, será adicional'
            }
          }
        }
      },
      hide: false
    }
  }
}

/**
 * List of Procedures to be created on each store after app installation.
 * Ref.: https://developers.e-com.plus/docs/api/#/store/procedures/
 */

const procedures = []

/**
 * Uncomment and edit code above to configure `triggers` and receive respective `webhooks`:
 */

const { baseUri } = require('./__env')

procedures.push({
  title: app.title,

  triggers: [
    /* Receive notifications when new order is created:
    {
      resource: 'orders',
      action: 'create',
    },
    */

    // Receive notifications when order financial/fulfillment status are set or changed:
    // Obs.: you probably SHOULD NOT enable the orders triggers below and the one above (create) together.
    {
      resource: 'orders',
      field: 'financial_status',
    },
    {
      resource: 'orders',
      field: 'fulfillment_status',
    },

    // Receive notifications when cart is created with customer:
    {
      resource: 'carts',
      field: 'customers',
    },

    // Receive notifications when customer is created:
    {
      resource: 'customers',
      action: 'create',
    },

    /* Receive notifications when products/variations stock quantity changes:
    {
      resource: 'products',
      field: 'quantity',
    },
    {
      resource: 'products',
      subresource: 'variations',
      field: 'quantity'
    },

    // Receive notifications when customer is deleted:
    

    // Feel free to create custom combinations with any Store API resource, subresource, action and field.
    */
  ],

  webhooks: [
    {
      api: {
        external_api: {
          uri: `${baseUri}/ecom/webhook`
        }
      },
      method: 'POST'
    }
  ]
})

exports.app = app

exports.procedures = procedures
