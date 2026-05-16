import { onCall } from 'firebase-functions/https';
import { graphApiRequest } from './common';
import { z } from 'zod';
import { checkRequest } from '../../utils';
// Send Order Details Message
export const sendOrderDetails = onCall(async (request) => {
  const schema = z.object({
    phoneNumberId: z.string().nonempty(),
    messaging_product: z.literal('whatsapp'),
    recipient_type: z.literal('individual'),
    to: z.string().nonempty(),
    type: z.literal('interactive'),
    interactive: z.object({
      type: z.literal('order_details'),
      header: z.object({
        type: z.literal('image'),
        image: z.object({ link: z.string().url() })
      }),
      body: z.object({ text: z.string() }),
      footer: z.object({ text: z.string() }),
      action: z.object({
        name: z.literal('review_and_pay'),
        parameters: z.object({
          reference_id: z.string(),
          type: z.literal('digital-goods'),
          payment_type: z.string(),
          payment_configuration: z.string(),
          currency: z.string(),
          total_amount: z.object({ value: z.number(), offset: z.number() }),
          order: z.object({
            status: z.string(),
            items: z.array(
              z.object({
                retailer_id: z.string(),
                name: z.string(),
                amount: z.object({ value: z.number(), offset: z.number() }),
                sale_amount: z.object({
                  value: z.number(),
                  offset: z.number()
                }),
                quantity: z.number()
              })
            ),
            subtotal: z.object({ value: z.number(), offset: z.number() }),
            tax: z.object({
              value: z.number(),
              offset: z.number(),
              description: z.string().optional()
            }),
            shipping: z.object({
              value: z.number(),
              offset: z.number(),
              description: z.string().optional()
            }),
            discount: z.object({
              value: z.number(),
              offset: z.number(),
              description: z.string().optional(),
              discount_program_name: z.string().optional()
            })
          })
        })
      })
    })
  });
  await checkRequest(request, schema, true);
  const { phoneNumberId, ...payload } = request.data;
  const res = await graphApiRequest(
    'post',
    `${phoneNumberId}/messages`,
    payload
  );
  return res.data;
});

// Send Order Status Message
export const sendOrderStatus = onCall(async (request) => {
  const schema = z.object({
    phoneNumberId: z.string().nonempty(),
    messaging_product: z.literal('whatsapp'),
    recipient_type: z.literal('individual'),
    to: z.string().nonempty(),
    type: z.literal('interactive'),
    interactive: z.object({
      type: z.literal('order_status'),
      body: z.object({ text: z.string() }),
      action: z.object({
        name: z.literal('review_order'),
        parameters: z.object({
          reference_id: z.string(),
          order: z.object({
            status: z.string(),
            description: z.string().optional()
          })
        })
      })
    })
  });
  await checkRequest(request, schema, true);
  const { phoneNumberId, ...payload } = request.data;
  const res = await graphApiRequest(
    'post',
    `${phoneNumberId}/messages`,
    payload
  );
  return res.data;
});
