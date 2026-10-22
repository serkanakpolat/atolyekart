import { useState } from 'react'
import { KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { EMAIL_PATTERN, EMAIL_HINT } from '../../src/lib/validation.js'
import { SITE_URL, buildOrderPayload, buildStockPayload, sendWebhook } from './api.js'
import { SERIF, useTheme } from './theme.js'

const EMAIL = new RegExp(`^${EMAIL_PATTERN}$`)

const FORMS = {
  order: {
    title: 'Sipariş Ver',
    submit: 'Siparişi Gönder',
    consentData: 'Ad soyad, telefon ve e-posta',
    build: buildOrderPayload,
    success: (p) => `${p.name} için seni en kısa sürede arayacağız.`,
    successTitle: 'Siparişin alındı.',
  },
  stock: {
    title: 'Stok Bildirimi İste',
    submit: 'Haber Ver',
    consentData: 'Ad soyad ve e-posta',
    build: buildStockPayload,
    success: (p) => `${p.name} yeniden hazır olduğunda sana e-posta ile haber vereceğiz.`,
    successTitle: 'Kaydın alındı.',
  },
}

function validate(type, f) {
  if (f.name.trim().length < 2) return 'Adını ve soyadını yaz.'
  if (type === 'order') {
    if (!/^(\+90|0)?5\d{9}$/.test(f.phone.replace(/[\s()-]/g, ''))) return 'Telefonu 05xx xxx xx xx biçiminde yaz.'
    const q = Number(f.quantity)
    if (!Number.isInteger(q) || q < 1 || q > 10) return 'Adet 1 ile 10 arasında olmalı.'
    if (f.email && !EMAIL.test(f.email)) return EMAIL_HINT
  } else if (!EMAIL.test(f.email)) {
    return EMAIL_HINT
  }
  if (!f.consent) return 'Devam etmek için açık rıza kutusunu işaretle.'
  return null
}

export default function FormSheet({ form, onClose }) {
  const t = useTheme()
  const s = styles(t)
  const config = FORMS[form.type]
  const { product } = form
  const [fields, setFields] = useState({ name: '', phone: '', email: '', quantity: '1', consent: false })
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const set = (key) => (value) => setFields((f) => ({ ...f, [key]: value }))

  async function submit() {
    const invalid = validate(form.type, fields)
    if (invalid) {
      setError(invalid)
      setStatus('error')
      return
    }
    setStatus('sending')
    setError('')
    try {
      const { consent, ...data } = fields
      await sendWebhook(config.build(product, { ...data, name: data.name.trim(), email: data.email.trim() }))
      setStatus('success')
    } catch (err) {
      setError(err.message || 'Bir şeyler ters gitti, lütfen tekrar dene.')
      setStatus('error')
    }
  }

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose} visible>
      <SafeAreaView style={s.sheet} edges={['top', 'bottom']}>
        <View style={s.header}>
          <Text style={s.title} accessibilityRole="header">{config.title}</Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Kapat" style={s.close}>
            <Text style={s.closeText}>✕</Text>
          </Pressable>
        </View>

        {status === 'success' ? (
          <View style={s.body} accessibilityLiveRegion="polite">
            <Text style={s.text}>
              <Text style={s.bold}>{config.successTitle}</Text> {config.success(product)}
            </Text>
            <Pressable style={({ pressed }) => [s.btn, pressed && s.btnPressed]} onPress={onClose} accessibilityRole="button">
              <Text style={s.btnText}>Tamam</Text>
            </Pressable>
          </View>
        ) : (
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
              <Text style={s.muted}>
                {form.type === 'stock' ? `${product.name} şu an tükendi. Yenisi atölyeden çıkınca ilk sen öğren.` : product.name}
              </Text>

              <Field label="Adın Soyadın" s={s}>
                <TextInput style={s.input} value={fields.name} onChangeText={set('name')} autoComplete="name" textContentType="name" autoFocus />
              </Field>
              {form.type === 'order' && (
                <Field label="Telefon" s={s}>
                  <TextInput style={s.input} value={fields.phone} onChangeText={set('phone')} keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" placeholder="05xx xxx xx xx" placeholderTextColor={t.muted} />
                </Field>
              )}
              <Field label={form.type === 'order' ? 'E-posta (isteğe bağlı)' : 'E-posta'} s={s}>
                <TextInput style={s.input} value={fields.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" />
              </Field>
              {form.type === 'order' && (
                <Field label="Adet" s={s}>
                  <TextInput style={[s.input, { width: 100 }]} value={fields.quantity} onChangeText={set('quantity')} keyboardType="number-pad" maxLength={2} />
                </Field>
              )}

              <Pressable
                style={s.consent}
                onPress={() => set('consent')(!fields.consent)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: fields.consent }}
              >
                <View style={[s.box, fields.consent && s.boxOn]}>{fields.consent && <Text style={s.tick}>✓</Text>}</View>
                <Text style={s.consentText}>
                  {config.consentData} bilgilerimin bu talebin yerine getirilmesi için işlenmesine ve yurt dışındaki sunuculara aktarılmasına,{' '}
                  <Text style={s.link} onPress={() => Linking.openURL(`${SITE_URL}/#gizlilik`)}>Gizlilik Politikası ve KVKK Aydınlatma Metni</Text>
                  {' '}kapsamında açık rıza veriyorum.
                </Text>
              </Pressable>

              {status === 'error' && <Text style={s.error} accessibilityRole="alert">{error}</Text>}

              <Pressable
                style={({ pressed }) => [s.btn, pressed && s.btnPressed, status === 'sending' && { opacity: 0.6 }]}
                onPress={submit}
                disabled={status === 'sending'}
                accessibilityRole="button"
              >
                <Text style={s.btnText}>{status === 'sending' ? 'Gönderiliyor…' : config.submit}</Text>
              </Pressable>
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    </Modal>
  )
}

function Field({ label, children, s }) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      {children}
    </View>
  )
}

const styles = (t) =>
  StyleSheet.create({
    sheet: { flex: 1, backgroundColor: t.card },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: t.line },
    title: { fontFamily: SERIF, fontSize: 22, fontWeight: '700', color: t.ink },
    close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    closeText: { fontSize: 20, color: t.ink },
    body: { padding: 20, gap: 16 },
    text: { fontFamily: SERIF, fontSize: 16, lineHeight: 24, color: t.ink },
    bold: { fontWeight: '700' },
    muted: { fontFamily: SERIF, fontSize: 15, color: t.muted },
    field: { gap: 6 },
    label: { fontFamily: SERIF, fontSize: 15, color: t.ink },
    input: { minHeight: 48, paddingHorizontal: 12, borderWidth: 1, borderColor: t.line, borderRadius: 8, backgroundColor: t.bg, color: t.ink, fontSize: 16 },
    consent: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
    box: { width: 24, height: 24, borderRadius: 4, borderWidth: 2, borderColor: t.ink, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
    boxOn: { backgroundColor: t.ink },
    tick: { color: t.card, fontSize: 15, fontWeight: '700' },
    consentText: { flex: 1, fontSize: 13, lineHeight: 19, color: t.muted },
    link: { color: t.ink, textDecorationLine: 'underline' },
    error: { color: t.danger, fontSize: 15 },
    btn: { alignSelf: 'flex-start', minHeight: 48, paddingHorizontal: 22, borderRadius: 999, backgroundColor: t.primary, alignItems: 'center', justifyContent: 'center' },
    btnPressed: { backgroundColor: t.primaryPressed },
    btnText: { color: t.onPrimary, fontSize: 16, fontWeight: '700' },
  })
