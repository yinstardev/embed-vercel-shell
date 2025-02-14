import {
  init,
  AuthType,
  LiveboardEmbed,
  SearchEmbed,
  EmbedConfig as BaseEmbedConfig,
  AuthStatus,
  EmbedConfig,
} from "@thoughtspot/visual-embed-sdk";


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

let currentEmbed: LiveboardEmbed | SearchEmbed | null = null;
let currentEmbedConfig: ExtendedEmbedConfig | null = null;
let tokenResolver: ((val: string) => void) | null = null;
let initializationComplete = false;
let currentViewConfig: any;

let isVercelShellInitialized = false;

window.addEventListener("message", (event: any) => {
  // let parsed: ParsedMessage;
  let parsed: any;
  parsed = event.data as any;
  alert(`parsed: ${JSON.stringify(parsed)}`);
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

    default:
      console.warn("Unknown message type:", parsed.type);
  }

}

const handleInit = async (parsed: any) => {

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
        alert("Success: SDK_SUCCESS");
        initTiming.end = Date.now();
        initTiming.total = (initTiming.end - initTiming.start) / 1000;
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
}; 

const handleTokenResponse = (parsed: any) => {
  if (tokenResolver && parsed.token) {
    tokenResolver(parsed.token);
  }
};

const handleEmbed = (parsed: any) => {
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

  if(!initializationComplete){
    console.log("initialization not complete yet");
    return;
  }

  setupThoughtSpotEmbed(embedType, viewConfig);
  console.log("EMBED setup complete!");
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

  let embedInstance: LiveboardEmbed | SearchEmbed | null = null;

    if (typeofEmbed === "Liveboard") {
        embedInstance = new LiveboardEmbed("#ts-embed", {
            ...viewConfig,
            additionalFlags: {
              "flipTooltipToContextMenuEnabled": "true",
              "contextMenuEnabledOnWhichClick": "left",
            }
        });
    } else if (typeofEmbed === "SearchEmbed") {
        embedInstance = new SearchEmbed("#ts-embed", {
            ...viewConfig,
        });
    } else {
        console.warn("Unrecognized typeofEmbed:", typeofEmbed);
        return;
    }

  embedInstance.render();
  currentEmbed = embedInstance;

    currentEmbed.on("*" as any, (embedEvent: any, data: any) => {
        const typeOfEvent = embedEvent.type;
        if (typeOfEvent) {
            window.ReactNativeWebView?.postMessage(
                JSON.stringify({
                    type: "EMBED_EVENT",
                    eventName: typeOfEvent,
                    data: embedEvent.data,
                })
            );
        }
    });
}

// // Reset flag on visibility change
// document.addEventListener('visibilitychange', () => {
//     if (document.visibilityState === 'visible') {
//         isVercelShellInitialized = false;
//         initializeVercelShell();
//     }
// });
