import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'fartlek'
const SITE_URL = 'https://fartlek.com.ua'

interface PaymentReminderProps {
  name?: string
  eventTitle?: string
  ticketUrl?: string
  amount?: string | number
}

const PaymentReminderEmail = ({
  name,
  eventTitle,
  ticketUrl,
  amount,
}: PaymentReminderProps) => {
  const finalTicketUrl = ticketUrl || SITE_URL
  return (
    <Html lang="uk" dir="ltr">
      <Head>
        {React.createElement('meta', { httpEquiv: 'Content-Type', content: 'text/html; charset=UTF-8' })}
      </Head>
      <Preview>
        Нагадування: оплата участі{eventTitle ? ` у «${eventTitle}»` : ''}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandBar}>
            <Text style={brandText}>{SITE_NAME.toUpperCase()}</Text>
          </Section>

          <Heading style={h1}>
            {name ? `Привіт, ${name}!` : 'Привіт!'}
          </Heading>

          <Text style={text}>
            Нагадуємо, що для вашої реєстрації{eventTitle ? <> на змагання <strong>«{eventTitle}»</strong></> : ''} ще <strong>не завантажена квитанція про оплату</strong>. Без неї участь не буде підтверджена.
          </Text>

          {amount ? (
            <Section style={amountBox}>
              <Text style={amountLabel}>Сума до сплати</Text>
              <Text style={amountValue}>{amount} грн</Text>
            </Section>
          ) : null}

          <Text style={text}>
            Якщо ви <strong>вже оплатили</strong> — перейдіть на сторінку квитка та <strong>завантажте квитанцію</strong> (фото або скріншот платежу).
          </Text>

          <Text style={text}>
            Якщо ще <strong>не оплатили</strong> — спочатку здійсніть оплату (кнопка «Оплатити» поряд із QR-кодом на сторінці квитка), а потім <strong>обов'язково завантажте квитанцію</strong>.
          </Text>

          <Section style={btnWrap}>
            <Button href={finalTicketUrl} style={btn}>
              Перейти до квитка
            </Button>
          </Section>

          <Text style={hint}>
            ⚠️ Участь підтверджується лише після того, як організатор перевірить завантажену квитанцію. Будь ласка, не забудьте цей крок.
          </Text>

          <Text style={footer}>
            З повагою,<br />
            команда {SITE_NAME}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: PaymentReminderEmail,
  subject: (data: Record<string, any>) =>
    data?.eventTitle
      ? `Нагадування про оплату: ${data.eventTitle}`
      : 'Нагадування про оплату участі',
  displayName: 'Нагадування про оплату',
  previewData: {
    name: 'Олександр',
    eventTitle: 'Київський напівмарафон',
    ticketUrl: 'https://fartlek.com.ua/ticket/example',
    amount: 500,
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { padding: '20px 25px', maxWidth: '560px', margin: '0 auto' }
const brandBar = { padding: '12px 0', borderBottom: '3px solid #ff5e1f', marginBottom: '24px' }
const brandText = { fontSize: '20px', fontWeight: 'bold', color: '#ff5e1f', margin: '0', letterSpacing: '2px' }
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#0f0f0f', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#3a3a3a', lineHeight: '1.6', margin: '0 0 16px' }
const amountBox = { backgroundColor: '#fff5ee', borderLeft: '4px solid #ff5e1f', padding: '14px 18px', margin: '16px 0', borderRadius: '6px' }
const amountLabel = { fontSize: '12px', color: '#7a7a7a', margin: '0 0 4px', textTransform: 'uppercase' as const }
const amountValue = { fontSize: '22px', fontWeight: 'bold', color: '#0f0f0f', margin: '0' }
const btnWrap = { textAlign: 'center' as const, margin: '28px 0' }
const btn = { backgroundColor: '#ff5e1f', color: '#ffffff', padding: '14px 32px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '15px', display: 'inline-block' }
const hint = { fontSize: '14px', color: '#3a3a3a', lineHeight: '1.6', margin: '20px 0', padding: '12px 16px', backgroundColor: '#fafafa', borderRadius: '6px' }
const footer = { fontSize: '13px', color: '#7a7a7a', margin: '32px 0 0', lineHeight: '1.6' }
