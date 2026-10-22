// KVKK açık rıza: işaretlenmeden form gönderilemez (required). Politika yeni sekmede açılır, form verisi kaybolmaz.
export default function ConsentCheckbox({ dataList }) {
  return (
    <label className="consent">
      <input type="checkbox" name="consent" required />
      <span>
        {dataList} bilgilerimin bu talebin yerine getirilmesi için işlenmesine ve yurt dışındaki sunuculara aktarılmasına,{' '}
        <a href="#gizlilik" target="_blank" rel="noopener">Gizlilik Politikası ve KVKK Aydınlatma Metni</a>
        {' '}kapsamında açık rıza veriyorum.
      </span>
    </label>
  )
}
