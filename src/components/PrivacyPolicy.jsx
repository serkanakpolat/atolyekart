// TASLAK — yayından önce [köşeli parantez] alanları doldurulmalı ve bir hukukçuya okutulmalı.
const UPDATED = '22 Ekim 2026'

export default function PrivacyPolicy() {
  return (
    <main className="policy">
      <a className="policy__back" href="#">← Kataloğa dön</a>
      <h1>Gizlilik Politikası ve KVKK Aydınlatma Metni</h1>
      <p className="policy__meta">Son güncelleme: {UPDATED}</p>

      <p>
        Ahşap ve Karakalem Atölyesi olarak sipariş ve stok bildirimi için bize verdiğin bilgileri yalnızca
        o talebi karşılamak için kullanıyoruz. Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu'nun
        (KVKK) 10. maddesi uyarınca seni bilgilendirmek için hazırlandı.
      </p>

      <h2>1. Veri sorumlusu</h2>
      <p>
        [Atölye sahibinin adı soyadı / unvanı], [açık adres]. İletişim: [e-posta adresi], [telefon].
      </p>

      <h2>2. Hangi verileri topluyoruz?</h2>
      <ul>
        <li><strong>Sipariş formu:</strong> ad soyad, telefon, e-posta (isteğe bağlı), sipariş edilen ürün ve adet.</li>
        <li><strong>Stok bildirimi formu:</strong> ad soyad, e-posta ve haber almak istediğin ürün.</li>
        <li><strong>Teknik kayıtlar:</strong> isteğin geldiği zaman ve barındırma sağlayıcısının tuttuğu sunucu kayıtları (IP adresi gibi).</li>
      </ul>
      <p>Sitede çerez, reklam veya takip aracı kullanmıyoruz. Hesap açman gerekmiyor.</p>

      <h2>3. Verileri ne için kullanıyoruz?</h2>
      <ul>
        <li>Siparişini teyit etmek, fiyat ve teslimat için seninle telefonla ya da e-postayla iletişime geçmek,</li>
        <li>Tükenen ürün yeniden hazır olduğunda sana bir kez haber vermek,</li>
        <li>Kötüye kullanımı (sahte, otomatik istekler) engellemek.</li>
      </ul>
      <p>Verilerini pazarlama, bülten veya reklam için kullanmıyoruz; üçüncü kişilere satmıyoruz.</p>

      <h2>4. Hukuki sebep</h2>
      <p>
        Verilerin, KVKK m. 5/1 uyarınca formda verdiğin <strong>açık rızaya</strong> ve m. 5/2-c uyarınca
        talep ettiğin siparişin kurulması ve ifası için zorunlu olmasına dayanarak işlenir.
      </p>

      <h2>5. Kimlere ve nereye aktarılıyor?</h2>
      <p>
        Site, ABD merkezli Vercel Inc. altyapısında çalışır; form bilgileri sipariş takibi için
        [kullanılan webhook / bildirim servisi] üzerinden atölyeye iletilir. Bu hizmetlerin sunucuları
        yurt dışında olabileceğinden verilerin, KVKK m. 9 uyarınca açık rızana dayanarak yurt dışına aktarılır.
        Yasal bir zorunluluk olmadıkça başka kimseyle paylaşılmaz.
      </p>

      <h2>6. Ne kadar süre saklıyoruz?</h2>
      <ul>
        <li>Sipariş bilgileri: sipariş tamamlandıktan sonra [2] yıl (olası iade ve şikâyetler için), vergi mevzuatının gerektirdiği kayıtlar yasal süre boyunca.</li>
        <li>Stok bildirimi: haber verildikten sonra ya da en geç [6] ay içinde silinir.</li>
        <li>Sunucu kayıtları: barındırma sağlayıcısının saklama süresi kadar (genellikle birkaç gün).</li>
      </ul>

      <h2>7. Hakların</h2>
      <p>KVKK m. 11 uyarınca bize başvurarak:</p>
      <ul>
        <li>Verilerinin işlenip işlenmediğini öğrenebilir, işlendiyse bilgi isteyebilirsin,</li>
        <li>Eksik veya yanlış verilerin düzeltilmesini, silinmesini ya da yok edilmesini isteyebilirsin,</li>
        <li>Verilerinin aktarıldığı üçüncü kişileri öğrenebilirsin,</li>
        <li>Açık rızanı dilediğin zaman geri alabilirsin,</li>
        <li>Kanuna aykırı işleme nedeniyle zarara uğradıysan zararın giderilmesini talep edebilirsin.</li>
      </ul>
      <p>
        Başvurunu [e-posta adresi] adresine yazabilirsin; en geç 30 gün içinde ücretsiz yanıt veririz.
        Yanıtımızı yeterli bulmazsan Kişisel Verileri Koruma Kurulu'na şikâyette bulunabilirsin.
      </p>

      <h2>8. Güvenlik</h2>
      <p>
        Formlar şifreli bağlantı (HTTPS) üzerinden gönderilir. Her istek, sunucumuzun imzaladığı ve
        5 dakika geçerli tek kullanımlık bir anahtarla doğrulanır; çok sık gönderilen istekler sınırlanır.
      </p>

      <h2>9. Değişiklikler</h2>
      <p>Bu metni güncellediğimizde yukarıdaki tarihi değiştiririz.</p>
    </main>
  )
}
