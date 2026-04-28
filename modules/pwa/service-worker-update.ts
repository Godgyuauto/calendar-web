const SKIP_WAITING_MESSAGE = { kind: "SKIP_WAITING" } as const;

export function requestServiceWorkerActivation(worker: ServiceWorker | null | undefined): void {
  worker?.postMessage(SKIP_WAITING_MESSAGE);
}

function activateWhenInstalled(worker: ServiceWorker | null): void {
  if (!worker) {
    return;
  }

  if (worker.state === "installed") {
    requestServiceWorkerActivation(worker);
    return;
  }

  const onStateChange = () => {
    if (worker.state !== "installed") {
      return;
    }

    worker.removeEventListener("statechange", onStateChange);
    requestServiceWorkerActivation(worker);
  };

  worker.addEventListener("statechange", onStateChange);
}

export function bindServiceWorkerUpdateActivation(
  registration: ServiceWorkerRegistration,
): () => void {
  const onUpdateFound = () => {
    activateWhenInstalled(registration.installing);
  };

  registration.addEventListener("updatefound", onUpdateFound);
  requestServiceWorkerActivation(registration.waiting);
  activateWhenInstalled(registration.installing);

  return () => {
    registration.removeEventListener("updatefound", onUpdateFound);
  };
}

export function bindForegroundServiceWorkerUpdates(
  registration: ServiceWorkerRegistration,
): () => void {
  let updateInFlight = false;

  const requestUpdate = () => {
    if (updateInFlight) {
      return;
    }

    updateInFlight = true;
    void registration
      .update()
      .then(() => {
        requestServiceWorkerActivation(registration.waiting);
        activateWhenInstalled(registration.installing);
      })
      .catch(() => {})
      .finally(() => {
        updateInFlight = false;
      });
  };

  const onVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      requestUpdate();
    }
  };

  window.addEventListener("focus", requestUpdate);
  document.addEventListener("visibilitychange", onVisibilityChange);

  return () => {
    window.removeEventListener("focus", requestUpdate);
    document.removeEventListener("visibilitychange", onVisibilityChange);
  };
}
