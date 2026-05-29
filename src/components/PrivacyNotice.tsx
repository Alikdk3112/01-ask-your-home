import { ShieldCheck, X } from 'lucide-react'

interface Props {
  onClose: () => void
}

/**
 * Privacy notice as a modal. Deliberately plain and honest: the app stores
 * nothing, uses no cookies/trackers, and keeps the API key server-side.
 */
export function PrivacyNotice({ onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 p-4"
      onClick={onClose}
    >
      <div
        className="ks-card max-h-[85vh] w-full max-w-lg overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-success" strokeWidth={2} />
            <h3 className="font-semibold text-ink">Privacy</h3>
          </div>
          <button type="button" onClick={onClose} className="text-muted hover:text-ink" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5 text-sm leading-relaxed text-ink-soft">
          <p className="font-medium text-ink">
            Your home stays yours. We collect as little as possible.
          </p>

          <ul className="space-y-3">
            <li>
              <span className="font-medium text-ink">No account, no cookies, no tracking.</span>{' '}
              You don’t have to sign up. We set no advertising or analytics cookies.
            </li>
            <li>
              <span className="font-medium text-ink">Your details stay in the browser.</span>{' '}
              Building type, year built, floor area and your answers live only in this session on your device.
              Close the tab and they’re gone. We don’t create a profile on any server.
            </li>
            <li>
              <span className="font-medium text-ink">Address search via OpenStreetMap.</span>{' '}
              When you type an address, we query the free services OpenStreetMap (Photon/Komoot) and OpenPLZ
              for suggestions. Only your search text goes there, no name, no contact details.
            </li>
            <li>
              <span className="font-medium text-ink">Chat answers via a secure proxy.</span>{' '}
              Questions in the open chat are answered by an AI model via OpenRouter. The access key
              lives exclusively on the server, never in your browser. Only the conversation you type
              yourself is transmitted.
            </li>
            <li>
              <span className="font-medium text-ink">No sharing, no selling.</span>{' '}
              There is no sale of data and no sharing with third parties for advertising purposes.
            </li>
          </ul>

          <p className="text-xs text-muted">
            This is a prototype built for a hackathon (Kenergy Solutions). The calculations are
            estimates and do not replace binding professional energy advice.
          </p>
        </div>

        <div className="border-t border-line p-3">
          <button type="button" onClick={onClose} className="ks-btn w-full">
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
