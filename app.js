/* ==========================================================================
   Lógica JavaScript - Invitación Mis 15 Años Vaiolet Nikol Jaelin
   Versión Premium — Experiencia de Tarjeta Física
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    // ── Datos del invitado (inyectados por generador o default) ──────────────
    const currentGuestData = window.CURRENT_GUEST || {
        name: "Invitado(s)",
        passes: 1,
        hasPet: false,
        petName: "",
        note: "",
        code: "VAI-15-HONOR-1P"
    };

    // ── Referencias DOM ──────────────────────────────────────────────────────
    const envelopeOverlay   = document.getElementById('envelopeOverlay');
    const invitationContent = document.getElementById('invitationContent');
    const openEnvelopeBtn   = document.getElementById('openEnvelopeBtn');
    const closeEnvelopeBtn  = document.getElementById('closeEnvelopeBtn');
    const envelope3d        = document.querySelector('.envelope-3d');

    const displayGuestName  = document.getElementById('displayGuestName');
    const displayPassesCount= document.getElementById('displayPassesCount');
    const specialPetNote    = document.getElementById('specialPetNote');
    const displayQrCodeId   = document.getElementById('displayQrCodeId');
    const qrcodeContainer   = document.getElementById('qrcode');

    const bgMusic           = document.getElementById('bgMusic');
    const musicToggle       = document.getElementById('musicToggle');
    const qrQuickBtn        = document.getElementById('qrQuickBtn');

    const rsvpForm          = document.getElementById('rsvpForm');
    const rsvpName          = document.getElementById('rsvpName');
    const rsvpCount         = document.getElementById('rsvpCount');
    const downloadPassBtn   = document.getElementById('downloadPassBtn');

    // ── Estado ───────────────────────────────────────────────────────────────
    let isOpened = false;
    let isAnimating = false;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const motionDelay = duration => prefersReducedMotion.matches ? 0 : duration;

    function reportAudioPlaybackError(error) {
        if (error?.name !== 'AbortError') {
            console.error('No se pudo reproducir la música:', error);
        }
    }

    function scrollToTop() {
        if (prefersReducedMotion.matches) {
            window.scrollTo(0, 0);
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    // ── Inicialización ───────────────────────────────────────────────────────
    updatePassCard();
    initCountdown();
    initMusicControls();
    initCloseButton();
    initEnvelopeInteraction();
    initRsvpForm();
    initDownloadPass();
    initQrQuickBtn();
    preventUnwantedNavigation();

    // =========================================================================
    // APERTURA DEL SOBRE
    // =========================================================================
    function openInvitationCard() {
        if (isAnimating || isOpened) return;
        isAnimating = true;

        // El gesto de abrir permite iniciar la música sin reproducirla al cargar.
        if (bgMusic && bgMusic.paused) {
            bgMusic.play()
                .then(() => {
                    if (musicToggle) {
                        musicToggle.classList.add('playing');
                        musicToggle.setAttribute('aria-pressed', 'true');
                    }
                })
                .catch(reportAudioPlaybackError);
        }

        // ── Paso 1: Abrir solapa del sobre (flip 3D) ─────────────────────────
        if (envelope3d) {
            envelope3d.classList.remove('flap-closing');
            envelope3d.classList.add('flap-opening');
        }

        // ── Paso 2: La tarjeta sube desde dentro ─────────────────────────────
        setTimeout(() => {
            if (envelope3d) envelope3d.classList.add('card-rising');
        }, motionDelay(750));

        // ── Paso 3: Fade-out del overlay y reveal de la tarjeta ──────────────
        setTimeout(() => {
            if (envelopeOverlay)   envelopeOverlay.classList.add('opened');
            if (invitationContent) {
                invitationContent.classList.remove('locked');
            }
            if (closeEnvelopeBtn)  closeEnvelopeBtn.classList.add('visible');
            scrollToTop();
            triggerConfetti();
            isOpened = true;
        }, motionDelay(1500));

        // ── Paso 4: Ocultar overlay del DOM ──────────────────────────────────
        setTimeout(() => {
            if (envelopeOverlay) envelopeOverlay.classList.add('hide-complete');
            isAnimating = false;
        }, motionDelay(2400));
    }
    window.openInvitationCard = openInvitationCard;

    // =========================================================================
    // CIERRE DEL SOBRE (vuelve a la portada)
    // =========================================================================
    function closeInvitationCard() {
        if (isAnimating || !isOpened) return;
        isAnimating = true;

        // Ocultar la tarjeta suavemente
        if (invitationContent) invitationContent.classList.add('locked');
        if (closeEnvelopeBtn)  closeEnvelopeBtn.classList.remove('visible');

        // Restaurar overlay
        if (envelopeOverlay) {
            envelopeOverlay.classList.remove('hide-complete');
            // Pequeño retraso para que el display:none se quite antes del fade-in
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    envelopeOverlay.classList.remove('opened');
                });
            });
        }

        // Animar cierre del sobre
        if (envelope3d) {
            // Quitar las clases de apertura con la animación de tarjeta bajando primero
            envelope3d.classList.remove('card-rising');
            setTimeout(() => {
                envelope3d.classList.remove('flap-opening');
                envelope3d.classList.add('flap-closing');
                setTimeout(() => {
                    envelope3d.classList.remove('flap-closing');
                    isAnimating = false;
                    isOpened = false;
                }, motionDelay(1000));
            }, motionDelay(300));
        }

        // Pausar música
        if (bgMusic && !bgMusic.paused) {
            bgMusic.pause();
            if (musicToggle) {
                musicToggle.classList.remove('playing');
                musicToggle.setAttribute('aria-pressed', 'false');
            }
        }

        scrollToTop();
    }

    // =========================================================================
    // INTERACCIÓN CON EL SOBRE
    // =========================================================================
    function initEnvelopeInteraction() {
        // Botón principal CTA "Abrir Invitación"
        if (openEnvelopeBtn) {
            openEnvelopeBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // No propagar al sobre
                openInvitationCard();
            });
        }

        // Hacer clic sobre el sobre 3D también abre (pero NO el botón que ya tiene listener)
        if (envelope3d) {
            envelope3d.addEventListener('click', (e) => {
                // Ignorar si se clickea el botón directo
                if (e.target.closest('#openEnvelopeBtn')) return;
                openInvitationCard();
            });
        }

        // Evitar que el overlay en sí (fondo) abra la tarjeta al tocarlo
        // — solo el sobre o el botón deben hacerlo
        if (envelopeOverlay) {
            envelopeOverlay.addEventListener('click', (e) => {
                // Solo actuar si el clic es directamente en el overlay (no en el contenido)
                if (e.target === envelopeOverlay) return; // no hacer nada
            });
        }
    }

    // =========================================================================
    // BOTÓN CERRAR
    // =========================================================================
    function initCloseButton() {
        if (closeEnvelopeBtn) {
            closeEnvelopeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                closeInvitationCard();
            });
        }
    }

    // =========================================================================
    // ACTUALIZAR TARJETA / PASE QR
    // =========================================================================
    function updatePassCard() {
        if (displayGuestName)   displayGuestName.textContent = currentGuestData.name;
        if (displayPassesCount) {
            const n = currentGuestData.passes;
            displayPassesCount.textContent = `${n} ${n === 1 ? 'Invitado Confirmado' : 'Invitados Confirmados'}`;
        }
        if (displayQrCodeId)    displayQrCodeId.textContent = currentGuestData.code;

        // Nota especial / mascota
        if (specialPetNote) {
            if (currentGuestData.hasPet || currentGuestData.note) {
                specialPetNote.style.display = 'flex';
                if (currentGuestData.hasPet) {
                    specialPetNote.innerHTML = `<i class="fas fa-dog pet-icon"></i> <span><strong>Pase Especial:</strong> ¡${currentGuestData.petName || 'Ramón'} es integrante de la familia! 🐶</span>`;
                } else {
                    specialPetNote.innerHTML = `<i class="fas fa-star pet-icon"></i> <span>${currentGuestData.note}</span>`;
                }
            } else {
                specialPetNote.style.display = 'none';
            }
        }

        // Pre-llenar RSVP
        if (rsvpName) {
            rsvpName.value = currentGuestData.name;
            rsvpName.readOnly = true;
            rsvpName.style.cursor = 'not-allowed';
            rsvpName.style.backgroundColor = 'rgba(255,255,255,0.5)';
        }
        if (rsvpCount) {
            const maxPasses = currentGuestData.passes || 1;
            rsvpCount.value = maxPasses;
            rsvpCount.max   = maxPasses;
            rsvpCount.min   = 1;

            // Nota de límite
            let hintEl = document.getElementById('rsvpCountHint');
            if (!hintEl && rsvpCount.parentNode) {
                hintEl = document.createElement('small');
                hintEl.id = 'rsvpCountHint';
                hintEl.style.cssText = 'display:block;color:#A88230;margin-top:5px;font-weight:600;font-size:0.85rem;';
                rsvpCount.parentNode.appendChild(hintEl);
            }
            if (hintEl) {
                hintEl.innerHTML = `<i class="fas fa-info-circle"></i> Máximo <strong>${maxPasses}</strong> ${maxPasses === 1 ? 'persona' : 'personas'} según tu invitación.`;
            }
        }

        // QR Code
        generateQRCode(JSON.stringify({
            invitado: currentGuestData.name,
            pases:    currentGuestData.passes,
            codigo:   currentGuestData.code
        }));
    }

    function generateQRCode(textData) {
        if (!qrcodeContainer) return;
        qrcodeContainer.innerHTML = '';

        if (window.PREGENERATED_QR) {
            qrcodeContainer.innerHTML = `<img src="${window.PREGENERATED_QR}" alt="Código QR Pase" style="width:150px;height:150px;border-radius:8px;">`;
            return;
        }

        try {
            if (typeof QRCode !== 'undefined') {
                new QRCode(qrcodeContainer, {
                    text: textData,
                    width: 150, height: 150,
                    colorDark: "#1C3322", colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.H
                });
            } else {
                console.error('No se pudo generar el código QR: la biblioteca local no está disponible.');
            }
        } catch (err) {
            console.error('QR error:', err);
        }
    }

    // =========================================================================
    // COUNTDOWN TIMER
    // =========================================================================
    function initCountdown() {
        const eventDate = new Date('2026-11-07T19:00:00-05:00').getTime();
        const pad = n => String(n).padStart(2, '0');

        function update() {
            const distance = eventDate - Date.now();
            if (distance <= 0) {
                const c = document.getElementById('countdown');
                if (c) c.innerHTML = '<h3 style="color:#A88230;font-size:1.5rem;font-family:\'Cinzel\',serif;">¡HOY ES EL GRAN DÍA! 🎉</h3>';
                return;
            }
            const d  = Math.floor(distance / 86400000);
            const h  = Math.floor((distance % 86400000) / 3600000);
            const m  = Math.floor((distance % 3600000) / 60000);
            const s  = Math.floor((distance % 60000) / 1000);

            const el = id => document.getElementById(id);
            if (el('days'))    el('days').textContent    = pad(d);
            if (el('hours'))   el('hours').textContent   = pad(h);
            if (el('minutes')) el('minutes').textContent = pad(m);
            if (el('seconds')) el('seconds').textContent = pad(s);
        }
        update();
        setInterval(update, 1000);
    }

    // =========================================================================
    // MÚSICA — Se activa al abrir por gesto del usuario y puede pausarse.
    // =========================================================================
    function initMusicControls() {
        if (!musicToggle || !bgMusic) return;
        musicToggle.addEventListener('click', () => {
            if (bgMusic.paused) {
                bgMusic.play()
                    .then(() => {
                        musicToggle.classList.add('playing');
                        musicToggle.setAttribute('aria-pressed', 'true');
                    })
                    .catch(reportAudioPlaybackError);
            } else {
                bgMusic.pause();
                musicToggle.classList.remove('playing');
                musicToggle.setAttribute('aria-pressed', 'false');
            }
        });
    }

    // =========================================================================
    // QR QUICK BTN → scroll suave
    // =========================================================================
    function initQrQuickBtn() {
        if (!qrQuickBtn) return;
        qrQuickBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const qrSection = document.getElementById('qrSection');
            if (qrSection) qrSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    // =========================================================================
    // FORMULARIO RSVP — WhatsApp
    // =========================================================================
    function initRsvpForm() {
        // Validación en tiempo real
        if (rsvpCount) {
            ['input', 'change'].forEach(evt => {
                rsvpCount.addEventListener(evt, () => {
                    const max = currentGuestData.passes || 1;
                    let v = parseInt(rsvpCount.value, 10);
                    if (isNaN(v) || v < 1) rsvpCount.value = 1;
                    else if (v > max)      rsvpCount.value = max;
                });
            });
        }

        if (!rsvpForm) return;
        const confirmationUrl = currentGuestData.confirmationUrl;
        const submitBtn = rsvpForm.querySelector('button[type="submit"]');
        if (confirmationUrl) {
            rsvpForm.querySelectorAll('.form-group').forEach(group => {
                group.hidden = true;
            });
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-clipboard-check"></i> Confirmar asistencia';
            }
            const sectionIcon = document.querySelector('.rsvp-icon');
            if (sectionIcon) {
                sectionIcon.classList.remove('fab', 'fa-whatsapp');
                sectionIcon.classList.add('fas', 'fa-clipboard-check');
            }
        }

        rsvpForm.addEventListener('submit', (e) => {
            e.preventDefault();

            if (confirmationUrl) {
                const link = document.createElement('a');
                link.href = confirmationUrl;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                document.body.appendChild(link);
                link.click();
                link.remove();
                return;
            }

            const origHTML   = submitBtn.innerHTML;
            submitBtn.innerHTML  = '<i class="fas fa-spinner fa-spin"></i> Preparando confirmación...';
            submitBtn.disabled   = true;

            const name       = rsvpName ? rsvpName.value.trim() : currentGuestData.name;
            const passes     = rsvpCount ? rsvpCount.value : currentGuestData.passes;
            const statusEl   = document.getElementById('rsvpStatus');
            const msgEl      = document.getElementById('rsvpMessage');
            const status     = statusEl ? statusEl.value : 'confirmado';
            const userMsg    = msgEl ? msgEl.value.trim() : '';
            const statusText = status === 'confirmado'
                ? '¡Sí, confirmo mi asistencia! 🎉'
                : 'Lamentablemente no podré asistir 💔';

            let msg = `*CONFIRMACIÓN DE ASISTENCIA - MIS 15 AÑOS*\n\n`;
            msg += `👤 *Invitado:* ${name}\n`;
            msg += `🎟️ *Pases:* ${passes}\n`;
            msg += `✅ *Estado:* ${statusText}\n`;
            if (userMsg) msg += `💬 *Mensaje:* "${userMsg}"\n`;
            msg += `\n✨ *Código:* ${currentGuestData.code}`;

            const phone = "573180685024";
            const url   = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`;

            // Abrir WhatsApp durante el gesto explícito para evitar bloqueos emergentes.
            const link = document.createElement('a');
            link.href   = url;
            link.target = '_blank';
            link.rel    = 'noopener noreferrer';
            document.body.appendChild(link);
            link.click();
            link.remove();

            submitBtn.innerHTML = '<i class="fas fa-check"></i> Abriendo WhatsApp...';
            setTimeout(() => {
                submitBtn.innerHTML = origHTML;
                submitBtn.disabled  = false;
            }, 3500);
        });
    }

    // =========================================================================
    // DESCARGAR PASE DIGITAL
    // =========================================================================
    function initDownloadPass() {
        if (!downloadPassBtn) return;
        downloadPassBtn.addEventListener('click', () => {
            const ticketCard = document.querySelector('.qr-ticket-card');
            const origHTML   = downloadPassBtn.innerHTML;
            downloadPassBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando Pase...';
            downloadPassBtn.disabled  = true;

            if (typeof html2canvas !== 'undefined' && ticketCard) {
                html2canvas(ticketCard, { scale: 2, backgroundColor: "#EBF3E7" })
                    .then(canvas => {
                        const link = document.createElement('a');
                        link.download = `Pase_15Anos_${currentGuestData.name.replace(/\s+/g, '_')}.png`;
                        link.href = canvas.toDataURL('image/png');
                        link.click();
                        triggerConfetti();
                        downloadPassBtn.innerHTML = '<i class="fas fa-check-circle"></i> ¡Pase Guardado!';
                        setTimeout(() => {
                            downloadPassBtn.innerHTML = origHTML;
                            downloadPassBtn.disabled  = false;
                        }, 3000);
                    })
                    .catch(err => {
                        console.error('html2canvas error:', err);
                        downloadPassBtn.innerHTML = origHTML;
                        downloadPassBtn.disabled  = false;
                        alert('Hubo un error al generar la imagen. Por favor toma una captura de pantalla.');
                    });
            } else {
                triggerConfetti();
                alert(`¡Pase de ${currentGuestData.name} listo! Toma una captura de pantalla.`);
                downloadPassBtn.innerHTML = origHTML;
                downloadPassBtn.disabled  = false;
            }
        });
    }

    // =========================================================================
    // PREVENIR NAVEGACIÓN NO DESEADA
    // Ningún elemento decorativo debe navegar. Solo los <a> explícitos con href.
    // =========================================================================
    function preventUnwantedNavigation() {
        // Elementos que NO deben disparar navegación al hacer clic
        const safeSelectors = [
            '.envelope-overlay',
            '.envelope-scene',
            '.envelope-3d .env-body',
            '.envelope-3d .env-back-flap',
            '.envelope-3d .env-front-flap',
            '.env-card-inside',
            '.env-card-preview',
            '.hero-section',
            '.hero-card-frame',
            '.hero-card-img',
            '.hero-info-below',
            '.floating-petals-bg',
            '.petal',
            '.section-card',
        ];

        // Solo prevenir si el target es exactamente esos elementos (no sus hijos interactivos)
        safeSelectors.forEach(sel => {
            document.querySelectorAll(sel).forEach(el => {
                el.addEventListener('click', (e) => {
                    // Si el elemento clickeado es un enlace real (<a>) con href, dejarlo pasar
                    if (e.target.tagName === 'A' && e.target.href) return;
                    // Si es un botón, dejarlo pasar
                    if (e.target.tagName === 'BUTTON') return;
                    if (e.target.closest('a[href]')) return;
                    if (e.target.closest('button')) return;
                    // Para todo lo demás, prevenir la propagación que podría causar navegación
                    e.stopPropagation();
                }, { capture: false });
            });
        });

        // ──────────────────────────────────────────────────────────────────────
        // Garantizar que el botón de ubicación (Google Maps) SÍ funcione
        // ──────────────────────────────────────────────────────────────────────
        const locationBtn = document.querySelector('.btn-location');
        if (locationBtn) {
            locationBtn.addEventListener('click', (e) => {
                // Dejar que el enlace funcione normalmente — NO prevenir
                // Solo aseguramos que tiene target="_blank" para no salir de la invitación
                if (!locationBtn.target) locationBtn.target = '_blank';
            });
        }
    }

    // =========================================================================
    // CONFETTI
    // =========================================================================
    function triggerConfetti() {
        if (prefersReducedMotion.matches) return;
        if (typeof confetti !== 'function') return;
        confetti({
            zIndex: 3500,
            particleCount: 120,
            spread: 85,
            origin: { y: 0.6 },
            colors: ['#8A9A5B', '#93C572', '#D4AF37', '#ffffff', '#B88E39']
        });
    }

});
