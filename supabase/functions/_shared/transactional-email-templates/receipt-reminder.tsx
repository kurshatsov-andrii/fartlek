import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'fartlek'
const SITE_URL = 'https://fartlek.com.ua'

interface ReceiptReminderProps {
  name?: string
  eventTitle?: string
  ticketUrl?: string
}

const ReceiptReminderEmail = ({
  name,
  eventTitle,
  ticketUrl,
}: ReceiptReminderProps) => {
  const finalTicketUrl = ticketUrl || SITE_URL
  return (
    <Html lang="uk" dir="ltr">
      <Head>
        {React.createElement('meta', { httpEquiv: 'Content-Type', content: 'text/html; charset=UTF-8' })}
      </Head>
      <Preview>
        Завантажте квитанцію про оплату{eventTitle ? ` для «${eventTitle}»` : ''}
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
            Дякуємо за реєстрацію{eventTitle ? <> на <strong>«{eventTitle}»</strong></> : ''}!
          </Text>

          <Text style={text}>
            Якщо ви вже здійснили оплату — будь ласка, <strong>завантажте квитанцію (чек)</strong> на платформі, щоб ми могли підтвердити вашу участь.
          </Text>

          <Section style={stepsBox}>
            <Text style={stepsTitle}>Як завантажити квитанцію:</Text>
            <Text style={stepItem}>1. Перейдіть на сторінку вашого квитка</Text>
            <Text style={stepItem}>2. Поряд із QR-кодом знайдіть кнопку <strong>«Завантажити квитанцію»</strong></Text>
            <Text style={stepItem}>3. Прикріпіть фото або PDF чека про оплату</Text>
          </Section>

          <Section style={btnWrap}>
            <Button href={finalTicketUrl} style={btn}>
              Перейти до квитка
            </Button>
          </Section>

          <Text style={hint}>
            Після завантаження квитанції організатор перевірить її, і у списку учасників ви отримаєте <strong>зелену галочку</strong> підтвердження оплати ✅
          </Text>

          <Text style={text}>
            Якщо ви ще не оплатили — це можна зробити прямо на сторінці квитка через кнопку оплати.
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
  component: ReceiptReminderEmail,
  subject: (data: Record<string, any>) =>
    data?.eventTitle
      ? `Завантажте квитанцію: ${data.eventTitle}`
      : 'Завантажте квитанцію про оплату',
  displayName: 'Нагадування про квитанцію',
  previewData: {
    name: 'Марія',
    eventTitle: 'Київський напівмарафон',
    ticketUrl: 'https://fartlek.com.ua/ticket/example',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { padding: '20px 25px', maxWidth: '560px', margin: '0 auto' }
const brandBar = { padding: '12px 0', borderBottom: '3px solid #ff5e1f', marginBottom: '24px' }
const brandText = { fontSize: '20px', fontWeight: 'bold', color: '#ff5e1f', margin: '0', letterSpacing: '2px' }
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#0f0f0f', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#3a3a3a', lineHeight: '1.6', margin: '0 0 16px' }
const stepsBox = { backgroundColor: '#fff5ee', padding: '16px 18px', margin: '16px 0', borderRadius: '8px', borderLeft: '4px solid #ff5e1f' }
const stepsTitle = { fontSize: '14px', fontWeight: 'bold', color: '#0f0f0f', margin: '0 0 10px' }
const stepItem = { fontSize: '14px', color: '#3a3a3a', lineHeight: '1.6', margin: '4px 0' }
const btnWrap = { textAlign: 'center' as const, margin: '28px 0' }
const btn = { backgroundColor: '#ff5e1f', color: '#ffffff', padding: '14px 32px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '15px', display: 'inline-block' }
const hint = { fontSize: '14px', color: '#3a3a3a', lineHeight: '1.6', margin: '20px 0', padding: '12px 16px', backgroundColor: '#fafafa', borderRadius: '6px' }
const footer = { fontSize: '13px', color: '#7a7a7a', margin: '32px 0 0', lineHeight: '1.6' }
