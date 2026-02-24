/**
 * Reusable destructive-action confirmation modal.
 *
 * Renders a centred dialog with a warning icon, a heading, a rich
 * description (ReactNode), and Cancel / Delete buttons.
 * Clicking the backdrop calls onCancel.
 */

interface DeleteConfirmModalProps {
  heading: string
  description: React.ReactNode
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteConfirmModal({
  heading,
  description,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />

      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Warning icon */}
        <div className="flex items-center justify-center size-12 rounded-full bg-destructive/10 mx-auto mb-4">
          <span className="material-symbols-outlined text-2xl text-destructive">warning</span>
        </div>

        <h3 className="text-base font-semibold text-foreground text-center mb-1">{heading}</h3>
        <p className="text-sm text-muted-foreground text-center mb-5">{description}</p>

        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-border text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors cursor-pointer shadow-sm"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
