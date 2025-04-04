javascript: (function () {
    const REDIRECTMOD_KEY = 'redirect_mod_key';
    const REDIRECTMOD_VALUE = 'active';
    const IFRAME_ID = 'embededframe';

    function isModActive() {
        return sessionStorage.getItem(REDIRECTMOD_KEY) === REDIRECTMOD_VALUE;
    }

    function activateMod() {
        sessionStorage.setItem(REDIRECTMOD_KEY, REDIRECTMOD_VALUE);
        console.log("redirect mod activated");
        const url = window.location.href;
        if (!isValidVideoURL(url)) {
            addListener(document);
            return;
        }
        embedVideo(getVideoId(url), false);
    }

    function deactivateMod() {
        sessionStorage.removeItem(REDIRECTMOD_KEY);
        removeListener();
        console.log("redirect mod deactivated");

        const url = window.location.href;
        if (!isValidVideoURL(url)) {
            return;
        }
        window.location.href = regularLinkBuilder(getVideoId(url));
    }

    function ToogleRedirectMod() {
        if (isModActive()) {
            deactivateMod();
        } else {
            activateMod();
        }
    }

    function addListener(newDocument) {
        newDocument.addEventListener('mousedown', redirectMod, true);
    }

    function removeListener() {
        const iframe = document.getElementById(IFRAME_ID);
        if (iframe) {
            iframe.contentDocument.removeEventListener('mousedown', redirectMod, true);
        } else {
            document.removeEventListener('mousedown', redirectMod, true);
        }
    }

    function updateCurrentDocumentOnLoad(iframe) {
        function onLoad() {
            if (iframe.contentDocument) {
                addListener(iframe.contentDocument);
                const titleElement = iframe.contentDocument.querySelector('a.ytp-title-link.yt-uix-sessionlink');
                if (titleElement) {
                    document.title = titleElement.innerText;
                }
                iframe.removeEventListener('load', onLoad);
            }
        }

        iframe.addEventListener('load', onLoad);
    }

    function isYouTubeURL(url) {
        if (!url.includes("www.youtube.com")) {

            return false;
        }
        return true;
    }

    function isValidVideoURL(url) {
        if (!url.includes('?')) {
            return false;
        }

        if (url.includes("/shorts/")) {
            return false;
        }

        return true;
    }

    function getVideoId(url) {
        const paramString = url.split("?")[1];
        return paramString.match(/(?<=v=)[^&]+/)?.[0];
    }

    function getVideoElement() {
        const iframe = document.getElementById(IFRAME_ID);
        if (iframe) {
            return iframe.contentDocument.querySelector('video');
        } else {

            return document.querySelector('video');
        }
    }

    function getVideoTimeStamp(video) {
        return Math.floor(video.currentTime);
    }

    function isVideoPlaying(video) {
        return !video.paused;
    }

    const redirectMod = function (event) {
        if (!isModActive()) {
            console.warn("redirect mod is not active but event listener is still attached");
            return;
        }

        if (event.button !== 0) {
            return;
        }

        const linkElement = event.target.closest('a');
        if (!linkElement || !linkElement.href) {
            return;
        }

        const originalHref = linkElement.href;
        if (!isYouTubeURL(originalHref) || originalHref == window.location.href) {
            ToogleRedirectMod();
            return;
        }

        if (!isValidVideoURL(originalHref)) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        embedVideo(getVideoId(originalHref), true);

    };

    function embedLinkBuilder(videoId, fromStart) {
        let nextUrl = 'https://www.youtube.com/embed/' + videoId;
        if (fromStart) {
            return nextUrl + '?autoplay=1';
        }

        const video = getVideoElement();
        if (!video) {
            console.warn("Video element not found.");
            return nextUrl + '?autoplay=1';;
        }

        const timeStamp = getVideoTimeStamp(video);
        const isPlaying = isVideoPlaying(video);
        const hasInitialized = timeStamp !== 0;

        if (isPlaying || hasInitialized) {
            nextUrl += '?';

            if (isPlaying) {
                nextUrl += 'autoplay=1';
            }

            if (hasInitialized) {
                if (isPlaying) {
                    nextUrl += '&';
                }
                nextUrl += 'start=' + timeStamp;
            }
        }
        return nextUrl;
    }

    function regularLinkBuilder(videoId) {
        let nextUrl = 'https://www.youtube.com/watch?v=' + videoId;

        const video = getVideoElement();
        if (!video) {
            return nextUrl;
        }

        const timeStamp = getVideoTimeStamp(video);
        const hasInitialized = timeStamp !== 0;

        if (hasInitialized) {
            nextUrl += '&t=' + timeStamp;
        }
        return nextUrl;
    }

    function embedVideo(videoId, fromStart) {
        console.log("redirecting embed");

        let nextUrl = embedLinkBuilder(videoId, fromStart);
        if (window.trustedTypes && trustedTypes.createPolicy) {
            const policy = trustedTypes.createPolicy('myAppPolicy', { createHTML: (html) => html });
            const safeHTML = policy.createHTML(
                `<iframe
                        id="${IFRAME_ID}"
                        width="100%"
                        height="100%"
                        src="${nextUrl}"
                        title="YouTube video player"
                        frameborder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; web-share"
                        referrerpolicy="strict-origin-when-cross-origin"
                        allowfullscreen>
                    </iframe>`
            );

            removeListener();
            document.body.innerHTML = safeHTML;

            document.body.style.backgroundColor = 'black';
            document.body.style.margin = '0';
            document.body.style.height = '100vh';
            document.body.style.overflow = 'hidden';


            history.replaceState(null, "", regularLinkBuilder(videoId));
            const iframe = document.getElementById(IFRAME_ID);
            updateCurrentDocumentOnLoad(iframe);
        }
    }

    if (!isYouTubeURL(window.location.hostname)) {
        console.error("invalid host");
        return;
    }

    ToogleRedirectMod();
})();
