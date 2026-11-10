Warning: truncated output (original token count: 11829)
Total output lines: 372

(() => {
  const mount = () => {
    if (!document.body || document.getElementById("tavenel-privacy-root")) return;
    const visibleUiText = (document.body.innerText || "").toLocaleLowerCase();
    const detectedPageLocale = visibleUiText.includes("nouvelle conversation") || visibleUiText.includes("comment puis-je vous aider") || visibleUiText.includes("recherche")
      ? "fr"
      : visibleUiText.includes("new chat") || visibleUiText.includes("how can i help") || visibleUiText.includes("search")
        ? "en"
        : null;
    const initialPageLocale = detectedPageLocale || ((document.documentElement.lang || navigator.language || "fr").toLowerCase().startsWith("en") ? "en" : "fr");

    const root = document.createElement("div");
    root.id = "tavenel-privacy-root";
    root.innerHTML = `
      <button class="tavenel-privacy-trigger" type="button" aria-haspopup="dialog" aria-expanded="false">
        <span class="tavenel-privacy-trigger-icon" aria-hidden="true">◇</span>
        <span>Paramètres et plus</span>
        <span class="tavenel-privacy-trigger-hint">Privé</span>
      </button>
      <section class="tavenel-privacy-menu" role="menu" aria-label="Confidentialité" hidden>
        <button class="tavenel-privacy-menu-item" type="button" data-view="preferences" role="menuitem">
          <span aria-hidden="true">⚙</span><span>Préférences</span>
        </button>
        <button class="tavenel-privacy-menu-item" type="button" data-view="protection" role="menuitem">
          <span aria-hidden="true">♢</span><span>Protection des discussions</span>
        </button>
        <button class="tavenel-privacy-menu-item" type="button" data-view="feedback" role="menuitem">
          <span aria-hidden="true">☏</span><span>Partagez vos commentaires</span>
        </button>
        <button class="tavenel-privacy-menu-item" type="button" data-view="transparency" role="menuitem">
          <span aria-hidden="true">◉</span><span>Provenance et transparence</span>
        </button>
        <button class="tavenel-privacy-menu-item" type="button" data-view="openwebui" role="menuitem">
          <span aria-hidden="true">↗</span><span>À propos d’Open WebUI</span>
        </button>
      </section>
      <div class="tavenel-privacy-backdrop" hidden>
        <section class="tavenel-privacy-dialog" role="dialog" aria-modal="true" aria-labelledby="tavenel-privacy-title" tabindex="-1">
          <button class="tavenel-privacy-close" type="button" aria-label="Fermer">×</button>
          <div class="tavenel-privacy-art" aria-hidden="true"><span>☁</span><b>✦</b><i>●</i></div>
          <p class="tavenel-privacy-eyebrow">SLM-Tavenel · confidentialité</p>
          <h2 id="tavenel-privacy-title">Toutes les discussions sont temporaires</h2>
          <div class="tavenel-language-switch" role="group" aria-label="Language / Langue">
            <button type="button" data-language="fr" aria-pressed="true">FR</button>
            <button type="button" data-language="en" aria-pressed="false">EN</button>
          </div>
          <div class="tavenel-privacy-cards">
            <article class="tavenel-privacy-card">
              <span class="tavenel-privacy-card-icon" aria-hidden="true">♙</span>
              <div><h3>Session invitée</h3><p>Pas de compte ni de mot de passe. Un identifiant aléatoire de navigateur sépare tes réglages de ceux des autres visiteurs.</p></div>
            </article>
            <article class="tavenel-privacy-card">
              <span class="tavenel-privacy-card-icon" aria-hidden="true">▤</span>
              <div><h3>Aucun historique de chat</h3><p>Le mode temporaire est imposé. Les conversations ne sont pas enregistrées dans l’historique Open WebUI et disparaissent à la fermeture de l’onglet.</p></div>
            </article>
            <article class="tavenel-privacy-card">
              <span class="tavenel-privacy-card-icon" aria-hidden="true">⌂</span>
              <div><h3>Traitement sur le VPS Tavenel</h3><p>Les messages sont traités sur le VPS par les modèles proposés, dont un modèle externe hébergé localement. Ils ne sont pas envoyés à un fournisseur externe d’inférence.</p></div>
            </article>
            <article class="tavenel-privacy-card">
              <span class="tavenel-privacy-card-icon" aria-hidden="true">◉</span>
              <div><h3>Pas d’entraînement sur tes messages</h3><p>Le service utilise les modèles en inférence et ne réentraîne pas les SLM à partir des conversations.</p></div>
            </article>
            <article class="tavenel-privacy-card tavenel-privacy-card-note">
              <span class="tavenel-privacy-card-icon" aria-hidden="true">ⓘ</span>
              <div><h3>Journaux techniques</h3><p>Les journaux du serveur peuvent contenir l’adresse IP et les chemins de requête pour la sécurité et le dépannage. Ils ne contiennent pas le texte des prompts dans les journaux d’accès.</p></div>
            </article>
          </div>
          <button class="tavenel-privacy-done" type="button">Compris</button>
        </section>
      </div>`;
    document.body.append(root);

    const warning = document.createElement("aside");
    warning.id = "tavenel-model-warning";
    warning.className = "tavenel-model-warning";
    warning.setAttribute("role", "note");
    warning.textContent = initialPageLocale === "en"
      ? "Notice: these experimental base models are not instruction-trained assistants. They may produce incoherent or inaccurate text and may not follow instructions. Check their outputs."
      : "Attention : ces modèles de base expérimentaux ne sont pas des assistants entraînés à suivre des consignes. Ils peuvent produire un texte incohérent ou inexact. Vérifie leurs réponses.";

    const placeModelWarning = () => {
      const composers = [...document.querySelectorAll("#chat-input, textarea, [contenteditable='true']")]
        .filter((element) => !root.contains(element));
      const composer = composers.find((element) => element.id === "chat-input")
        || composers.find((element) => {
          const placeholder = `${element.getAttribute("placeholder") || ""} ${element.getAttribute("data-placeholder") || ""}`.toLowerCase();
          return placeholder.includes("how can i help") || placeholder.includes("comment puis-je vous aider") || placeholder.includes("message");
        })
        || composers.find((element) => element.getBoundingClientRect().width > 160);
      if (!composer) return;
      const composerContainer = composer.closest("form") || composer.parentElement;
      if (!composerContainer?.parentElement) return;
      if (warning.nextElementSibling !== composerContainer) composerContainer.before(warning);
    };

    let warningFrame = 0;
    const warningObserver = new MutationObserver(() => {
      if (warningFrame) return;
      warningFrame = requestAnimationFrame(() => {
        warningFrame = 0;
        placeModelWarning();
      });
    });
    warningObserver.observe(document.body, { childList: true, subtree: true });
    placeModelWarning();

    const trigger = root.querySelector(".tavenel-privacy-trigger");
    const menu = root.querySelector(".tavenel-privacy-menu");
    const backdrop = root.querySelector(".tavenel-privacy-backdrop");
    const dialog = root.querySelector(".tavenel-privacy-dialog");
    const title = root.querySelector("#tavenel-privacy-title");
    const cards = root.querySelector(".tavenel-privacy-cards");
    const protectionTitle = title.textContent;
    const protectionCards = cards.innerHTML;
    const preferencesTitle = "Préférences";
    const feedbackTitle = "Coin-coin ! Nous sommes ravis.";
    const transparencyTitle = "Provenance, transparence et impact";
    const traceVisibilityKey = "tavenel-show-inference-traces";
    let showInferenceTraces = false;
    try { showInferenceTraces = localStorage.getItem(traceVisibilityKey) === "true"; } catch { /* Use the private default for this page. */ }
    document.body.classList.toggle("tavenel-show-inference-traces", showInferenceTraces);
    const preferencesCards = `
      <article class="tavenel-privacy-card">
        <span class="tavenel-privacy-card-icon" aria-hidden="true">▤</span>
        <div><h3>Historique des discussions</h3><p>Mode temporaire activé et imposé. Les chats ne sont pas enregistrés.</p></div>
      </article>
      <article class="tavenel-privacy-card">
        <span class="tavenel-privacy-card-icon" aria-hidden="true">♙</span>
        <div><h3>Session invitée</h3><p>Un identifiant aléatoire sépare les réglages de ce navigateur. Il expire après 30 jours.</p></div>
      </article>
      <article class="tavenel-privacy-card">
        <span class="tavenel-privacy-card-icon" aria-hidden="true">⌂</span>
        <div><h3>Modèles disponibles</h3><p>Le sélecteur contient les cinq SLM-Tavenel et le modèle TinyStories, clairement identifié comme externe.</p></div>
      </article>
      <article class="tavenel-privacy-card">
        <span class="tavenel-privacy-card-icon" aria-hidden="true">◉</span>
        <div><h3>Trace après chaque réponse</h3><label class="tavenel-trace-toggle-label"><input class="tavenel-trace-toggle" type="checkbox"> Afficher la trace d’inférence et l’impact estimé</label></div>
      </article>`;
    const feedbackCards = `
      <p class="tavenel-feedback-prompt">Qu’aimerais-tu nous dire ?</p>
      <div class="tavenel-feedback-options" role="group" aria-label="Sujet du commentaire">
        <button type="button" class="tavenel-feedback-chip">Bonne politique de confidentialité</button>
        <button type="button" class="tavenel-feedback-chip">Informations pertinentes</button>
        <button type="button" class="tavenel-feedback-chip">Accès facile à différents modèles d’IA</button>
        <button type="button" class="tavenel-feedback-chip">Utile</button>
        <button type="button" class="tavenel-feedback-chip">Suggérer une fonctionnalité</button>
        <button type="button" class="tavenel-feedback-chip">Autre chose</button>
      </div>
      <label class="tavenel-feedback-label" for="tavenel-feedback-text">Tes remarques</label>
      <textarea id="tavenel-feedback-text" class="tavenel-feedback-text" rows="3" maxlength="2000" placeholder="Dis-nous ce que tu en penses…"></textarea>
      <p class="tavenel-feedback-privacy">Aucun envoi au serveur. Tu peux partager tes remarques avec le moyen de ton choix ou préparer un e-mail.</p>
      <button type="button" class="tavenel-privacy-done tavenel-feedback-submit">Partager mes remarques</button>
      <a class="tavenel-feedback-email" href="mailto:slm-tavenel-tech@proton.me">Écrire à slm-tavenel-tech@proton.me</a>
      <p class="tavenel-feedback-status" role="status" aria-live="polite"></p>`;
    const transparencyCards = `
      <p class="tavenel-transparency-intro">Je documente les sources, les licences déclarées, les étapes de traitement et les limites de chaque expérience. La licence MIT des poids et du code ne remplace pas les licences des corpus, et ces relevés ne constituent pas une validation juridique indépendante. Les scripts, rapports et audits sont aussi publiés dans le <a href="https://github.com/thekester/slm-tavenel" target="_blank" rel="noopener noreferrer">dépôt GitHub SLM-Tavenel ↗</a>.</p>
      <details class="tavenel-model-provenance">
        <summary>SLM-Tavenel 1M · 1,18 million de paramètres</summary>
        <div class="tavenel-model-provenance-body"><p><b>Corpus :</b> sous-ensemble <code>french_open_science</code> de French-Science-Commons, 1 229 documents (748 anglais, 481 français). Les métadonnées HAL concordaient avec CC0 pour 3 450 des 3 483 notices examinées ; 33 ont été écartées. C’est un contrôle de métadonnées, pas une preuve des droits des déposants ou éditeurs.</p><p><b>Entraînement :</b> from scratch, environ 0,06 heure GPU ; énergie non mesurée. Poids et code sous MIT ; corpus source CC0 déclaré.</p><a href="https://huggingface.co/athenista/slm-tavenel-1m/blob/77d1d8b09af0ff8583844460f383f8f1c4f9bd96/README.md#data-licenses-and-privacy" target="_blank" rel="noopener noreferrer">Fiche, audit et dossier de traçabilité ↗</a></div>
      </details>
      <details class="tavenel-model-provenance">
        <summary>SLM-Tavenel 10M · 9,98 millions de paramètres</summary>
        <div class="tavenel-model-provenance-body"><p><b>Corpus :</b> French-Science-Commons, 31 417 notices conservées, étiquetées CC0 (4 528), CC-BY 4.0 (26 368) et Licence Ouverte 2.0 (521). CC-BY et Licence Ouverte impliquent des conditions d’attribution. L’audit HAL laisse 155 notices avec divergence, conflit, licence de fichier manquante ou identifiant introuvable.</p><p><b>Entraînement :</b> from scratch, environ 2,5 heures GPU ; énergie non mesurée. MIT couvre le code et les poids, pas les contenus sources ni leurs conditions propres.</p><a href="https://huggingface.co/athenista/slm-tavenel-10m/blob/f763b6f39d21baf388f8e0cd10f324a13a7caec8/README.md#data-licenses-and-privacy" target="_blank" rel="noopener noreferrer">Fiche, licences et manifestes ↗</a></div>
      </details>
      <details class="tavenel-model-provenance">
        <summary>SLM-Tavenel 25M · 25,7 millions de paramètres</summary>
        <div class="tavenel-model-provenance-body"><p><b>Lignée :</b> modèle grandi depuis le 10M puis entraîné sur French-Science-Commons avec 491,52 millions de positions de tokens supplémentaires. Les 155 écarts de licences relevés dans l’audit HAL restent non résolus ; la revue humaine des droits et de la vie privée est en attente.</p><p><b>Entraînement :</b> environ 5,5 heures GPU ; énergie non mesurée. La licence MIT des poids et du code ne relicencie pas les corpus amont.</p><a href="https://huggingface.co/athenista/slm-tavenel-25m/blob/b0b5d762a500c8b14ccc9b7ddcddab6d5e49ec05/README.md#data-licenses-and-privacy" target="_blank" rel="noopener noreferrer">Fiche, audits et manifeste source ↗</a></div>
      </details>
      <details class="tavenel-model-provenance">
        <summary>SLM-Tavenel 25M HPLT 10% · continuation</summary>
        <div class="tavenel-model-provenance-body"><p><b>Corpus :</b> continuation du 25M avec environ 90 % de tokens issus de French-Science-Commons et 10 % d’un mélange dérivé de HPLT. Le jeu HPLT amont déclare CC0 et décrit des collectes du Web ; cette déclaration ne vérifie pas les droits de chaque page. Pas de validation indépendante des droits pour cette version.</p><p><b>Entraînement :</b> 1 500 étapes, environ 0,8 heure GPU ; énergie non mesurée. Aucun journal d’observabilité propre à cette continuation n’a été enregistré ; les diagnostics du 25M parent restent consultables séparément.</p><a href="https://huggingface.co/athenista/slm-tavenel-25m-hplt-10pct/blob/98904f24de85ddbc5c9c243a695e3afe79930589/README.md#data-licenses-and-privacy" target="_blank" rel="noopener noreferrer">Fiche, mélange de données et limites ↗</a></div>
      </details>
      <details class="tavenel-model-provenance">
        <summary>SLM-Tavenel 124M · 124 millions de paramètres</summary>
        <div class="tavenel-model-provenance-body"><p><b>Corpus :</b> FineWeb-Edu filtré (anglais) et FineWeb2-HQ (français), 983 millions de positions de tokens. Leurs fiches déclarent ODC-By 1.0 et renvoient aux conditions de Common Crawl. Le tokenizer vient de SmolLM2-360M, sous Apache-2.0. La provenance des déclarations est documentée, les droits de chaque page source ne sont pas vérifiés indépendamment.</p><p><b>Entraînement :</b> from scratch, environ 57 heures GPU ; énergie non mesurée. MIT couvre les poids et le code du projet, pas les corpus amont ni le tokenizer tiers.</p><a href="https://huggingface.co/athenista/slm-tavenel-124m/blob/877392873e7e46c0e5946d6e943ce4e90f71a49f/README.md#data-licens…3829 tokens truncated…endently verified.</p><p><b>Training:</b> from scratch, about 57 GPU-hours; energy was not measured. MIT covers project weights and code, not upstream datasets or the third-party tokenizer.</p><a href="https://huggingface.co/athenista/slm-tavenel-124m/blob/877392873e7e46c0e5946d6e943ce4e90f71a49f/README.md#data-licenses-and-privacy" target="_blank" rel="noopener noreferrer">Model card, manifests and observability ↗</a></div></details>
          <details class="tavenel-model-provenance"><summary>External model · TinyStories Llama2 1M</summary><div class="tavenel-model-provenance-body"><p><b>Origin:</b> model by <a href="https://huggingface.co/shibatch/tiny1m" target="_blank" rel="noopener noreferrer">shibatch/tiny1m</a>, about 896,256 parameters, scaled-down Llama 2 architecture, 512-token vocabulary and 256-token maximum context. Its repository describes training on TinyStories.</p><p><b>Provenance and limits:</b> this model was not created or trained by Tavenel. Its card declares an MIT license for the model files; that does not independently establish rights for every item in the TinyStories corpus. Training energy and hardware are not documented here. The server loads Hugging Face revision <code>fdacad8ff9dc</code>.</p><a href="https://huggingface.co/shibatch/tiny1m/tree/fdacad8ff9dc27bd72c77d3684075a494be1ba11" target="_blank" rel="noopener noreferrer">Files at the tested revision ↗</a></div></details>
          <details class="tavenel-model-provenance"><summary>Training energy, measurements and extrapolation</summary><div class="tavenel-model-provenance-body"><p><b>Scope:</b> since November 6, NVML reads the GPU board’s energy counter. It includes all GPU activity during a run, not only the model. It excludes CPU, RAM, power-supply losses and the rest of the system.</p><ul><li>H-Net 75M, EXP-0040: 197 Wh, steps 500 to 1,500 only.</li><li>EXP-0043 control: 231 Wh, complete run.</li><li>EXP-0043 good views v2: 153 Wh, complete run.</li><li>EXP-0043 v1 collapsed: 159 Wh, complete run.</li><li>124M general web, EXP-0036b: 415 Wh at step 2,150 of 15,000, currently running and measured from step 0.</li></ul><p><b>Five released models:</b> the 1M, 10M, 25M, 25M HPLT and 124M have no measured training energy. Their documented GPU times are about 0.06, 2.5, 5.5, 0.8 and 57 hours respectively.</p><p><b>124M extrapolation:</b> about 2.9 kWh for 15,000 steps, based on EXP-0036b at about 0.19 Wh per step. This is not a measurement of the released model: the data differ and the reference run includes recomputed segments after resuming.</p><p><b>Training machine:</b> Intel Core i7-12650H, 10 cores and 16 threads; 63.7 GB RAM; RTX 4060 Laptop GPU, 8 GB, default power limit 80 W and maximum 105 W. Whole-machine idle power has not been measured. A one-time GPU-only reading was about 4.5 W. CPU power is not logged and no wall meter is used. GPU energy therefore cannot be used to calculate whole-system energy.</p><p><a href="https://github.com/thekester/slm-tavenel/blob/main/src/slm/energy.py" target="_blank" rel="noopener noreferrer">NVML meter code ↗</a> · <a href="https://github.com/thekester/slm-tavenel/blob/main/experiments/EXP-0040-hnet-byte-level-pilot-2026-11-01.md" target="_blank" rel="noopener noreferrer">EXP-0040 ↗</a> · <a href="https://github.com/thekester/slm-tavenel/blob/main/experiments/EXP-0043-goodview-jepa-en-fr-2026-11-08.md" target="_blank" rel="noopener noreferrer">EXP-0043 ↗</a> · <a href="https://github.com/thekester/slm-tavenel/blob/main/configs/train/exp0036b-124m-general-web-continuation.yaml" target="_blank" rel="noopener noreferrer">EXP-0036b config ↗</a></p></div></details>
          <details class="tavenel-model-provenance"><summary>Rights and privacy audit status</summary><div class="tavenel-model-provenance-body"><p>No newer audit or human validation is recorded. For the French-Science-Commons lineage used by the 10M, 25M and HPLT variant, 155 of 31,417 records remain unresolved: 72 mismatches, 3 conflicts, 24 missing file-license metadata records and 56 missing identifiers. Published review records still show the reviewer as “Pending”; human rights and privacy sign-offs remain false.</p><p>The October 23 precautionary policy excludes these 155 records from future corpora, but does not change models already trained. HPLT page-level rights have not been established.</p><p><a href="https://github.com/thekester/slm-tavenel/blob/main/docs/reviews/EXP-0009-HAL-FILE-LICENSE-AUDIT-2026-10-22.md" target="_blank" rel="noopener noreferrer">HAL audit ↗</a> · <a href="https://github.com/thekester/slm-tavenel/blob/main/docs/reviews/EXP-0010-HAL-FILE-LICENSE-ADDENDUM-2026-10-22.md" target="_blank" rel="noopener noreferrer">Audit addendum ↗</a> · <a href="https://github.com/thekester/slm-tavenel/blob/main/docs/reviews/EXP-0009-CONSERVATIVE-LICENSE-POLICY.md" target="_blank" rel="noopener noreferrer">Precautionary policy ↗</a></p></div></details>
          <article class="tavenel-privacy-card"><span class="tavenel-privacy-card-icon">⌂</span><div><h3>Hosting</h3><p>Hostinger VPS KVM 2 · Ubuntu 24.04 · Paris, France. Inference for the five SLM-Tavenel models and the TinyStories model runs on this VPS.</p></div></article>
          <article class="tavenel-privacy-card"><span class="tavenel-privacy-card-icon">◉</span><div><h3>Trace for every response</h3><p>After generation, the trace shows the SLM and Hugging Face revision, parameters, a prompt fingerprint, token counts, CPU time and elapsed time.</p></div></article>
          <article class="tavenel-privacy-card"><span class="tavenel-privacy-card-icon">⚡</span><div><h3>Estimated electricity</h3><p>Per-request estimate: measured CPU time × an assumed 10 to 20 W per active core. The VPS does not expose a hardware energy meter.</p></div></article>
          <article class="tavenel-privacy-card"><span class="tavenel-privacy-card-icon">♻</span><div><h3>Estimated CO₂e</h3><p>The estimate uses 20 gCO₂e/kWh, France’s 2025 annual average for consumed electricity published by RTE. This is not an hourly measurement at the data center.</p></div></article>
          <article class="tavenel-privacy-card tavenel-privacy-card-note"><span class="tavenel-privacy-card-icon">ⓘ</span><div><h3>Limits and explainability</h3><p>This is not a physical measurement: memory, network, cooling, PUE and hardware manufacturing are excluded. Published training logs show internal diagnostics on fixed probe batches; they describe statistical behavior but do not causally explain an individual answer.</p></div></article>`,
        done: "Close"
      },
      openwebui: {
        title: "Discover Open WebUI",
        cards: `<article class="tavenel-privacy-card"><span class="tavenel-privacy-card-icon">↗</span><div><h3>Open WebUI powers this chat interface</h3><p>Open WebUI is an independent project with publicly available source code, developed in the open. <a href="https://openwebui.com/" target="_blank" rel="noopener noreferrer">Visit Open WebUI</a> or <a href="https://github.com/open-webui/open-webui" target="_blank" rel="noopener noreferrer">explore its code on GitHub</a>.</p><p>This customized deployment is not the official Open WebUI product and is not maintained by its team.</p><p>Version 0.13.3 uses the Open WebUI License. Since version 0.6.6, the license includes a brand-preservation clause and is not OSI-certified as an open source license. <a href="https://docs.openwebui.com/license/" target="_blank" rel="noopener noreferrer">Read the license</a>.</p></div></article>`,
        done: "Close"
      }
    };
    let currentLocale = "fr";
    let activeView = "protection";
    const openMenu = () => {
      menu.hidden = false;
      trigger.setAttribute("aria-expanded", "true");
    };
    const closeMenu = () => {
      menu.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
    };
    const closeDialog = () => {
      backdrop.hidden = true;
      trigger.focus();
    };

    const savedLocale = (() => { try { return localStorage.getItem("tavenel-ui-language"); } catch { return null; } })();
    currentLocale = detectedPageLocale || (savedLocale === "en" || savedLocale === "fr" ? savedLocale : initialPageLocale);
    const localizeShell = () => {
      const en = currentLocale === "en";
      trigger.querySelector("span:nth-child(2)").textContent = en ? "Settings and more" : "Paramètres et plus";
      trigger.querySelector(".tavenel-privacy-trigger-hint").textContent = en ? "Private" : "Privé";
      menu.setAttribute("aria-label", en ? "Privacy" : "Confidentialité");
      const labels = en
        ? { preferences: "Preferences", protection: "Chat protection", feedback: "Share your feedback", transparency: "Provenance and transparency", openwebui: "About Open WebUI" }
        : { preferences: "Préférences", protection: "Protection des discussions", feedback: "Partagez vos commentaires", transparency: "Provenance et transparence", openwebui: "À propos d’Open WebUI" };
      root.querySelectorAll("[data-view]").forEach((item) => { item.querySelector("span:last-child").textContent = labels[item.dataset.view]; });
      root.querySelector(".tavenel-privacy-close").setAttribute("aria-label", en ? "Close" : "Fermer");
      root.querySelector(".tavenel-privacy-eyebrow").textContent = en ? "SLM-Tavenel · privacy" : "SLM-Tavenel · confidentialité";
      root.querySelectorAll("[data-language]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.language === currentLocale)));
      root.dataset.language = currentLocale;
    };
    const renderView = (view) => {
      activeView = view;
      const en = currentLocale === "en";
      const englishView = englishViews[view];
      const frenchViews = {
        protection: { title: protectionTitle, cards: protectionCards, done: "Compris" },
        preferences: { title: preferencesTitle, cards: preferencesCards, done: "Compris" },
        feedback: { title: feedbackTitle, cards: feedbackCards, done: "Fermer" },
        transparency: { title: transparencyTitle, cards: transparencyCards, done: "Fermer" },
        openwebui: {
          title: "Découvrir Open WebUI",
          cards: `<article class="tavenel-privacy-card"><span class="tavenel-privacy-card-icon">↗</span><div><h3>Open WebUI propulse cette interface de chat</h3><p>Open WebUI est un projet indépendant dont le code source est public et développé ouvertement. <a href="https://openwebui.com/" target="_blank" rel="noopener noreferrer">Découvrir Open WebUI</a> ou <a href="https://github.com/open-webui/open-webui" target="_blank" rel="noopener noreferrer">explorer son code sur GitHub</a>.</p><p>Cette instance personnalisée n’est pas le produit officiel Open WebUI et n’est pas maintenue par son équipe.</p><p>La version 0.13.3 utilise la licence Open WebUI. Depuis la version 0.6.6, celle-ci comprend une clause de préservation de la marque et n’est pas certifiée open source par l’OSI. <a href="https://docs.openwebui.com/license/" target="_blank" rel="noopener noreferrer">Lire la licence</a>.</p></div></article>`,
          done: "Fermer"
        }
      };
      const content = en ? englishView : frenchViews[view];
      title.textContent = content.title;
      cards.innerHTML = content.cards;
      dialog.querySelector(":scope > .tavenel-privacy-done").textContent = content.done;
      const traceToggle = cards.querySelector(".tavenel-trace-toggle");
      if (traceToggle) {
        traceToggle.checked = showInferenceTraces;
        traceToggle.addEventListener("change", () => {
          showInferenceTraces = traceToggle.checked;
          document.body.classList.toggle("tavenel-show-inference-traces", showInferenceTraces);
          try { localStorage.setItem(traceVisibilityKey, String(showInferenceTraces)); } catch { /* The choice lasts for this page only. */ }
        });
      }
      dialog.classList.toggle("tavenel-privacy-preferences", view === "preferences");
      dialog.classList.toggle("tavenel-privacy-feedback", view === "feedback");
      dialog.classList.toggle("tavenel-privacy-transparency", view === "transparency");
      if (view === "feedback") setupFeedback(cards, en);
    };
    localizeShell();
    renderView("protection");

    trigger.addEventListener("click", () => menu.hidden ? openMenu() : closeMenu());
    root.querySelectorAll("[data-view]").forEach((item) => item.addEventListener("click", () => {
      closeMenu();
      renderView(item.dataset.view);
      backdrop.hidden = false;
      dialog.focus();
    }));
    root.querySelectorAll("[data-language]").forEach((button) => button.addEventListener("click", () => {
      currentLocale = button.dataset.language;
      try { localStorage.setItem("tavenel-ui-language", currentLocale); } catch { /* Keep the choice for this page only. */ }
      localizeShell();
      renderView(activeView);
    }));
    root.querySelector(".tavenel-privacy-close").addEventListener("click", closeDialog);
    root.querySelector(".tavenel-privacy-done").addEventListener("click", closeDialog);
    backdrop.addEventListener("click", (event) => { if (event.target === backdrop) closeDialog(); });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        if (!backdrop.hidden) closeDialog();
        else closeMenu();
      }
    });
    document.addEventListener("click", (event) => {
      if (!menu.hidden && !root.contains(event.target)) closeMenu();
    });
  };

  function setupFeedback(container, english) {
    const selected = new Set();
    const composeMessage = () => {
      const details = container.querySelector(".tavenel-feedback-text").value.trim();
      return english
        ? [`Topics: ${[...selected].join(", ") || "not specified"}`, `Comments: ${details || "none"}`].join("\n")
        : [`Sujets : ${[...selected].join(", ") || "non précisé"}`, `Remarques : ${details || "aucune"}`].join("\n");
    };
    container.querySelectorAll(".tavenel-feedback-chip").forEach((chip) => chip.addEventListener("click", () => {
      if (selected.has(chip.textContent)) {
        selected.delete(chip.textContent);
        chip.classList.remove("is-selected");
        chip.setAttribute("aria-pressed", "false");
      } else {
        selected.add(chip.textContent);
        chip.classList.add("is-selected");
        chip.setAttribute("aria-pressed", "true");
      }
    }));
    container.querySelector(".tavenel-feedback-email").addEventListener("click", (event) => {
      event.preventDefault();
      const subject = english ? "SLM-Tavenel feedback" : "Commentaires SLM-Tavenel";
      const body = composeMessage();
      window.location.href = `mailto:slm-tavenel-tech@proton.me?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
    container.querySelector(".tavenel-feedback-submit").addEventListener("click", async () => {
      const message = composeMessage();
      const status = container.querySelector(".tavenel-feedback-status");
      if (navigator.share) {
        try {
          await navigator.share({ title: english ? "SLM-Tavenel feedback" : "Commentaires SLM-Tavenel", text: message });
          status.textContent = english ? "The share menu was opened." : "Le partage a été ouvert.";
          return;
        } catch (error) {
          if (error.name === "AbortError") return;
        }
      }
      try {
        await navigator.clipboard.writeText(message);
        status.textContent = english ? "Comments copied. You can now share them." : "Remarques copiées. Tu peux maintenant les partager.";
      } catch {
        status.textContent = english ? "Clipboard access is unavailable in this browser." : "La copie automatique n’est pas disponible dans ce navigateur.";
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, { once: true });
  else mount();
})();

