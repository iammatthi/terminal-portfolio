import { NextApiRequest, NextApiResponse } from 'next'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { message } = req.body

  const data = {
    service_id: process.env.EMAILJS_SERVICE_ID!,
    template_id: process.env.EMAILJS_TEMPLATE_ID!,
    user_id: process.env.EMAILJS_PUBLIC_KEY!,
    accessToken: process.env.EMAILJS_PRIVATE_KEY!,
    template_params: { message: message },
  }

  const emailRes = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  const emailResData = await emailRes.text()

  res.status(emailRes.status).json({ data: emailResData })
}
