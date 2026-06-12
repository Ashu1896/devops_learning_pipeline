export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered with scope:', registration.scope);
          
          // Request notification permissions
          if ('Notification' in window) {
            Notification.requestPermission().then((permission) => {
              if (permission === 'granted') {
                console.log('Push notification permissions granted.');
              }
            });
          }
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    });
  }
}
export default registerServiceWorker;
