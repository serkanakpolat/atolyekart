import { useEffect, useRef } from 'react'

// Native <dialog>: Esc ile kapanma ve odak yönetimi tarayıcıdan gelir.
export default function FormDialog({ title, onClose, children }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog.open) dialog.showModal()
  }, [])

  // Arka plana (dialog'un kendisine) tıklanınca kapat
  function handleClick(event) {
    if (event.target === dialogRef.current) dialogRef.current.close()
  }

  return (
    <dialog ref={dialogRef} className="form-dialog" onClose={onClose} onClick={handleClick} aria-labelledby="form-dialog-title">
      <div className="form-dialog__body">
        <header className="form-dialog__header">
          <h2 id="form-dialog-title">{title}</h2>
          <button type="button" className="form-dialog__close" onClick={() => dialogRef.current.close()} aria-label="Kapat">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </header>
        {children}
      </div>
    </dialog>
  )
}
