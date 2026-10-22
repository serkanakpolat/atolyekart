import { useState } from 'react'
import { FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { products } from '../src/data/products.js'
import { imageUrl } from './src/api.js'
import { SERIF, useTheme } from './src/theme.js'
import FormSheet from './src/FormSheet.js'

const categories = [...new Set(products.map((p) => p.category))]
const formatPrice = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' ₺'

export default function App() {
  const t = useTheme()
  const s = styles(t)
  const [category, setCategory] = useState(null)
  const [activeForm, setActiveForm] = useState(null)
  const visible = category ? products.filter((p) => p.category === category) : products

  const header = (
    <View>
      <View style={s.hero}>
        <Text style={s.h1} accessibilityRole="header">Ahşap ve Karakalem Atölyesi</Text>
        <Text style={s.sub}>Elde kesilmiş ahşap figürler ve özgün karakalem çizimler</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
        {[null, ...categories].map((c) => {
          const selected = category === c
          return (
            <Pressable key={c ?? 'all'} onPress={() => setCategory(c)} style={[s.chip, selected && s.chipOn]} accessibilityRole="button" accessibilityState={{ selected }}>
              <Text style={[s.chipText, selected && s.chipTextOn]}>{c ?? 'Tümü'}</Text>
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )

  return (
    <SafeAreaProvider>
      <SafeAreaView style={s.screen} edges={['top']}>
        <StatusBar style="auto" />
        <FlatList
          data={visible}
          keyExtractor={(p) => p.id}
          ListHeaderComponent={header}
          ListFooterComponent={<Text style={s.footer}>Her ürün tek tek, elde üretilir. © Ahşap ve Karakalem Atölyesi</Text>}
          contentContainerStyle={s.list}
          renderItem={({ item: p }) => (
            <View style={s.card}>
              <View style={s.frame}>
                <Image source={{ uri: imageUrl(p.image) }} style={s.image} resizeMode="contain" accessibilityLabel={p.imageAlt} />
              </View>
              <View style={s.meta}>
                <Text style={s.category}>{p.category}</Text>
                {!p.inStock && <Text style={s.badge}>Tükendi</Text>}
              </View>
              <Text style={s.h2}>{p.name}</Text>
              <Text style={s.desc}>{p.description}</Text>
              <View style={s.cardFooter}>
                <Pressable
                  onPress={() => setActiveForm({ type: p.inStock ? 'order' : 'stock', product: p })}
                  style={({ pressed }) => [p.inStock ? s.btnPrimary : s.btnSecondary, pressed && { opacity: 0.8 }]}
                  accessibilityRole="button"
                >
                  <Text style={p.inStock ? s.btnPrimaryText : s.btnSecondaryText}>{p.inStock ? 'Sipariş Ver' : 'Gelince Haber Ver'}</Text>
                </Pressable>
                <Text style={s.price}>{formatPrice(p.price)}</Text>
              </View>
            </View>
          )}
        />
        {activeForm && <FormSheet form={activeForm} onClose={() => setActiveForm(null)} />}
      </SafeAreaView>
    </SafeAreaProvider>
  )
}

const styles = (t) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.bg },
    list: { paddingHorizontal: 16, paddingBottom: 32, gap: 20 },
    hero: { alignItems: 'center', paddingTop: 24, paddingBottom: 16 },
    h1: { fontFamily: SERIF, fontSize: 28, fontWeight: '700', color: t.ink, textAlign: 'center' },
    sub: { fontFamily: SERIF, fontSize: 15, color: t.muted, marginTop: 6, textAlign: 'center' },
    chips: { gap: 8, paddingVertical: 8 },
    chip: { minHeight: 40, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1, borderColor: t.line, backgroundColor: t.card, justifyContent: 'center' },
    chipOn: { backgroundColor: t.primary, borderColor: t.primary },
    chipText: { color: t.ink, fontSize: 15 },
    chipTextOn: { color: t.onPrimary, fontWeight: '700' },
    card: { backgroundColor: t.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: t.line },
    frame: { borderWidth: 10, borderColor: t.frame, backgroundColor: t.mat, padding: 14, marginBottom: 14 },
    image: { width: '100%', aspectRatio: 1 },
    meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    category: { fontSize: 13, color: t.muted, textTransform: 'uppercase', letterSpacing: 0.6 },
    badge: { fontSize: 12, color: t.ink, borderWidth: 1, borderColor: t.ink, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 1 },
    h2: { fontFamily: SERIF, fontSize: 21, fontWeight: '700', color: t.ink, marginTop: 6 },
    desc: { fontFamily: SERIF, fontSize: 15, lineHeight: 23, color: t.muted, marginTop: 6 },
    cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
    btnPrimary: { minHeight: 48, paddingHorizontal: 20, borderRadius: 999, backgroundColor: t.primary, justifyContent: 'center' },
    btnPrimaryText: { color: t.onPrimary, fontSize: 16, fontWeight: '700' },
    btnSecondary: { minHeight: 48, paddingHorizontal: 20, borderRadius: 999, borderWidth: 1.5, borderColor: t.ink, justifyContent: 'center' },
    btnSecondaryText: { color: t.ink, fontSize: 16, fontWeight: '700' },
    price: { fontFamily: SERIF, fontSize: 19, fontWeight: '700', color: t.ink },
    footer: { textAlign: 'center', color: t.muted, fontSize: 13, paddingTop: 12 },
  })
