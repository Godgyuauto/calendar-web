"use client";

import { useEffect } from "react";

import {
  bindForegroundServiceWorkerUpdates,
  bindServiceWorkerUpdateActivation,
  requestServiceWorkerActivation,
} from "@/modules/pwa/service-worker-update";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    let reloaded = false;
    let disposed = false;
    let unbindUpdateActivation = () => {};
    let unbindForegroundUpdates = () => {};
    const onControllerChange = () => {
      if (reloaded) {
        return;
      }
      reloaded = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          updateViaCache: "none",
        });
        if (disposed) {
          return;
        }
        unbindUpdateActivation = bindServiceWorkerUpdateActivation(registration);
        unbindForegroundUpdates = bindForegroundServiceWorkerUpdates(registration);
        await registration.update();
        if (registration.waiting) {
          requestServiceWorkerActivation(registration.waiting);
        }
      } catch (error) {
        void error;
      }
    };

    void register();

    return () => {
      disposed = true;
      unbindUpdateActivation();
      unbindForegroundUpdates();
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  return null;
}
