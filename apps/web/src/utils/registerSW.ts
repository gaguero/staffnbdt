import { Workbox } from 'workbox-window'

let wb: Workbox | null = null

export function registerSW() {
  if ('serviceWorker' in navigator) {
    wb = new Workbox('/sw.js')

    wb.addEventListener('controlling', () => {
      window.location.reload()
    })

    wb.addEventListener('waiting', () => {
      // Show update available notification
      if (confirm('New version available! Click OK to update.')) {
        wb?.messageSkipWaiting()
      }
    })

    wb.addEventListener('installed', (event) => {
      if (event.isUpdate) {
        console.log('App updated!')
      } else {
        console.log('App installed!')
      }
    })

    wb.register()
      .then((registration) => {
        console.log('SW registered: ', registration)
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError)
      })
  }
}

export function updateSW() {
  if (wb) {
    wb.messageSkipWaiting()
  }
}