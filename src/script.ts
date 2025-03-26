import {
  init,
  AuthType,
  LiveboardEmbed,
  SearchEmbed,
  EmbedConfig as BaseEmbedConfig,
  AuthStatus,
  EmbedConfig,
  Action,
  ConversationEmbed,
} from "@thoughtspot/visual-embed-sdk";
import { validateAndMergeViewCOnfig } from "./utils";

declare global {
  interface Window {
    tsembed: {
      init: typeof init;
      AuthType: typeof AuthType;
      LiveboardEmbed: typeof LiveboardEmbed;
      SearchEmbed: typeof SearchEmbed;
    };
    ReactNativeWebView?: {
      postMessage: (msg: string) => void;
    };
  }
}
export interface ExtendedEmbedConfig extends BaseEmbedConfig {
  getTokenFromSDK?: boolean;
}

interface HostEventReplyData {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

let currentEmbed: LiveboardEmbed | SearchEmbed | ConversationEmbed | null = null;
let currentEmbedConfig: ExtendedEmbedConfig | null = null;
let tokenResolver: ((val: string) => void) | null = null;
let initializationComplete = false;
let currentViewConfig: any;

let isVercelShellInitialized = false;
const eventResponders = new Map<string, Function>();

const RESPONDER_TIMEOUT = 30000;

window.addEventListener("message", (event: any) => {
  let parsed: any;
  parsed = event.data as any;
  handleMessages(parsed);
});

const handleMessages = (parsed: any) => {
  switch (parsed.type) {
    case "INIT":
      handleInit(parsed);
      break;

    case "AUTH_TOKEN_RESPONSE":
      handleTokenResponse(parsed);
      break;

    case "EMBED":
      handleEmbed(parsed);
      break;

    case "HOST_EVENT":
      handleHostEvent(parsed);
      break;

    case "EMBED_EVENT_REPLY":
      handleEmbedEvent(parsed);
      break;

    default:
      console.warn("Unknown message type:", parsed.type);
  }

}

const handleEmbedEvent = (parsed: any) => {
  const eventId = parsed.eventId;
  if (eventId) {
    const responderFn = eventResponders.get(eventId);
    if (responderFn) {
      responderFn(parsed.payload);
      eventResponders.delete(eventId);
    }
  }
}

const handleInit = async (parsed: any) => {
  try {
    currentEmbedConfig = parsed.payload || null;
    if (currentEmbedConfig && currentEmbedConfig.getTokenFromSDK === true) {
      currentEmbedConfig.getAuthToken = async () => requestAuthToken();
    }

    if (currentEmbedConfig) {
      const authEventEmitter = await init(currentEmbedConfig as EmbedConfig);

      let initTiming = { start: Date.now(), end: 0, total: 0 };
      authEventEmitter.on(AuthStatus.SUCCESS, () => {
        alert("Success: TrustedAuthTokenCookieless");
        console.log("Success: TrustedAuthTokenCookieless");
      });

      authEventEmitter.on(AuthStatus.FAILURE, (error) => {
        alert(`Auth fail ${error}`);
        console.log(`Auth fail ${error}`);
        initializationComplete = false;
      });

      authEventEmitter.on(AuthStatus.SDK_SUCCESS, () => {
        initTiming.end = Date.now();
        initTiming.total = (initTiming.end - initTiming.start) / 1000;
        alert("Login success");
        console.log("Login success");

        initializationComplete = true;
        if (currentViewConfig) {
          setupThoughtSpotEmbed(
            currentViewConfig.embedType || "",
            currentViewConfig.viewConfig || {}
          );
        }
      });
    }
  } catch (error) {
    alert("Error initializing embed:" + error);
    // Handle the error gracefully, e.g., show a user-friendly message
  }
}

// handleInit({});

const handleTokenResponse = (parsed: any) => {
  if (tokenResolver && parsed.token) {
    tokenResolver(parsed.token);
  }
};

const handleEmbed = (parsed: any) => {
  try {
    if (!currentEmbedConfig) {
      console.log("No embedConfig in place. Did you call INIT first?");
      return;
    }
    const { embedType, viewConfig } = parsed;

    if (!embedType || !viewConfig) {
      console.log("Missing typeofEmbed or viewConfig in EMBED message.");
      return;
    }
    currentViewConfig = {
      embedType,
      viewConfig
    };

    if (!initializationComplete) {
      console.log("initialization not complete yet");
      return;
    }

    setupThoughtSpotEmbed(embedType, viewConfig);
    console.log("EMBED setup complete!");
  } catch (error) {
    alert("Error handling embed:" + error);
    // Handle the error gracefully
  }
}

function requestAuthToken(): Promise<string> {
  window.ReactNativeWebView?.postMessage(
    JSON.stringify({ type: "REQUEST_AUTH_TOKEN" })
  );
  return new Promise((resolve) => {
    tokenResolver = resolve;
  });
}

function initVercelShellMsg() {
  if (isVercelShellInitialized) return;
  const vercelShellInit = {
    type: "INIT_VERCEL_SHELL",
    status: "ready"
  };
  window.ReactNativeWebView?.postMessage(JSON.stringify(vercelShellInit));
  isVercelShellInitialized = true;
}

function initializeVercelShell() {
  initVercelShellMsg();
  setTimeout(() => {
    if (!isVercelShellInitialized) {
      console.log("Retrying Vercel shell initialization...");
      initVercelShellMsg();
    }
  }, 1000);
}

// Call on page load
window.addEventListener('load', initializeVercelShell);

async function handleHostEvent(parsed: any) {
  if (!currentEmbed) {
    console.warn("No embed instance for HOST_EVENT");
    sendHostEventReply(parsed.eventId, {
      success: false,
      message: "No embed instance",
    });
    return;
  }

  try {
    const result = await (currentEmbed.trigger as any)?.(parsed.eventName!, parsed.payload);
    sendHostEventReply(parsed.eventId, {
      success: true,
      data: result ?? null,
    });
  } catch (err) {
    console.error("Host event error:", err);
    sendHostEventReply(parsed.eventId, {
      success: false,
      error: String(err),
    });
  }
}

function sendHostEventReply(eventId: string | undefined, data: HostEventReplyData) {
  if (!eventId) return;
  window.ReactNativeWebView?.postMessage(
    JSON.stringify({
      type: "HOST_EVENT_REPLY",
      eventId,
      data,
    })
  );
}

/**
 * thoughtspot embed : liveboard or search
 */
function setupThoughtSpotEmbed(typeofEmbed: string, viewConfig: Record<string, any>) {
  if (!isVercelShellInitialized) {
    initializeVercelShell();
  }

  if (currentEmbed) {
    currentEmbed.destroy?.();
    currentEmbed = null;
  }

  let embedInstance: LiveboardEmbed | SearchEmbed | ConversationEmbed | null = null;
  const { worksheetId, ...newViewConfig } = viewConfig;
  if (typeofEmbed === "Liveboard") {
    embedInstance = new LiveboardEmbed("#ts-embed", {
      ...validateAndMergeViewCOnfig(viewConfig),
    });
  } else if (typeofEmbed === "SearchEmbed") {
    embedInstance = new SearchEmbed("#ts-embed", {
      ...viewConfig,
    });

  } else if (typeofEmbed == 'Conversation') {
    const embedContainer = document.getElementById('ts-embed');
    alert(`WorksheetId : ${worksheetId}`);
    if (embedContainer) {
      embedInstance = new ConversationEmbed(embedContainer, {
        ...newViewConfig,
        worksheetId: "9a527010-0a08-4b54-9700-e6da0a82a084",
      })
    }
  } else {
    console.warn("Unrecognized typeofEmbed:", typeofEmbed);
    return;
  }

  embedInstance?.render();
  alert(` This is iframe SRC : ${JSON.stringify(embedInstance)} `);
  currentEmbed = embedInstance;

  currentEmbed?.on("*" as any, (embedEvent: any, responderFn?: Function) => {
    const eventId = responderFn ? Math.random().toString(36).substring(7) : undefined;
    if (responderFn && eventId) {
      setTimeout(() => {
        if (eventResponders.has(eventId)) {
          console.warn(`Responder ${eventId} timeout!!`);
          eventResponders.delete(eventId);
        }
      }, RESPONDER_TIMEOUT);

      eventResponders.set(eventId, responderFn);
    }

    window.ReactNativeWebView?.postMessage(
      JSON.stringify({
        type: "EMBED_EVENT",
        eventId,
        eventName: embedEvent.type,
        data: embedEvent.data,
        hasResponder: !!responderFn
      })
    );

  });
}
// setupThoughtSpotEmbed("Conversation", {});
function cleanupStaleResponders() {
  if (eventResponders.size > 100) {
    console.warn('High number of stored responders');
  }
}

// // Reset flag on visibility change
// document.addEventListener('visibilitychange', () => {
//     if (document.visibilityState === 'visible') {
//         isVercelShellInitialized = false;
//         initializeVercelShell();
//     }
// });

// Global error handler
window.addEventListener('error', (event) => {
  alert('Global error caught:' + event.error);
  // Optionally, send error details to a logging service
});
