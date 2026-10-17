// type="email" tek başına "ali@site" gibi noktasız alan adlarını da geçerli sayar (HTML spesifikasyonu).
// Bu desen alan adında en az bir nokta ister; boş parça ("ali@.com", "ali@site..com") kabul etmez.
// Tarayıcı pattern'i baştan sona eşleşme olarak, "v" bayrağıyla derler.
export const EMAIL_PATTERN = String.raw`[^@\s]+@[^@\s.]+(\.[^@\s.]+)+`
export const EMAIL_HINT = 'Adresi ad@ornek.com biçiminde yaz.'
