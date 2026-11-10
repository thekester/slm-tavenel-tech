# Diagnostic RGPD du chat SLM-Tavenel

Statut : document de travail, pas une notice d'information pour les visiteurs et pas une attestation de conformite. Il decrit les elements visibles dans le depot local au 10 novembre 2026. Les traitements reels doivent etre verifies sur le VPS et aupres des prestataires avant toute declaration de conformite.

## Elements identifies dans le code

- Les messages sont envoyes a l'API Transformers exploitee sur le VPS pour produire une reponse. Le code de l'API ne journalise pas le contenu des prompts dans une instruction explicite de journalisation. Les journaux du proxy, du systeme, du fournisseur VPS et les sauvegardes ne sont pas tous inspectables depuis ce depot.
- Le service utilise des chats temporaires. Le depot indique que les messages ne sont pas enregistres dans l'historique Open WebUI. Cette affirmation ne prouve pas a elle seule leur suppression des journaux, memoires de navigateur ou sauvegardes.
- Les preferences de langue et d'affichage de la trace d'inference peuvent etre enregistrees dans `localStorage` du navigateur.
- Un ancien parcours invite utilise un identifiant de navigateur dans un cookie d'une duree de 30 jours et cree une identite invitee Open WebUI. La duree de vie des donnees associees dans la base Open WebUI n'est pas etablie par le depot.
- Le formulaire de commentaires ne transmet pas son contenu au serveur du chat. Il ouvre le partage natif du navigateur, copie le commentaire ou prepare un message vers l'adresse de contact. Si la personne choisit l'e-mail, son application de messagerie traite alors le contenu.
- La configuration pointe vers un VPS Hostinger et le modele est execute localement. La localisation effective, les journaux du prestataire et les sous-traitants ulterieurs doivent etre confirmes dans les documents et reglages Hostinger.
- La trace d'inference affiche des mesures et une empreinte tronquee du prompt. Le service ne s'en sert pas pour rechercher ou identifier un visiteur, mais une empreinte de texte peut rester une donnee pseudonyme dans certains contextes.

## Informations a confirmer avant de publier une notice RGPD

1. Identite juridique exacte du responsable du traitement, adresse postale a publier et adresse de contact pour les droits.
2. Finalites precises et base(s) legale(s) retenue(s) pour l'inference, la securite, les preferences locales et la gestion des demandes de droits.
3. Donnees effectivement journalisees par Caddy, Open WebUI, Ubuntu et Hostinger, personnes qui y ont acces et durees de conservation/sauvegarde associees.
4. Suppression effective des comptes invites, notes, parametres et autres donnees Open WebUI, y compris lorsque le cookie expire ou que l'utilisateur ferme l'onglet.
5. Emplacement de traitement et de sauvegarde du VPS, conditions contractuelles de sous-traitance de Hostinger et liste des sous-traitants pertinents.
6. Processus permettant de recevoir, verifier et traiter les demandes d'acces, rectification, effacement, limitation et opposition, ainsi que les exceptions applicables aux donnees deja effacees ou non conserves.
7. Public vise, notamment la presence eventuelle de mineurs, et evaluation de la necessite d'une analyse d'impact relative a la protection des donnees.

## Suite de travail

- Etablir le registre des traitements et une cartographie des flux et acces.
- Fixer une duree justifiee pour chaque categorie de donnees, appliquer une suppression automatique et verifier la suppression dans les sauvegardes.
- Verifier qu'aucun prompt ou contenu de reponse n'est present dans les journaux ou outils de supervision; limiter et proteger les metadonnees necessaires a la securite.
- Publier une notice accessible depuis l'interface avec le responsable, les finalites, bases legales, donnees, destinataires, durees, droits, contact et reclamation aupres de la CNIL.
- Examiner les cookies et stockages locaux selon leur finalite; ne conserver que ceux necessaires ou obtenir le consentement requis.
- Documenter les contrats de sous-traitance et les mesures de securite, puis tester periodiquement les demandes d'effacement, sauvegardes et restauration.

## References de travail

- [CNIL - Se mettre en conformite](https://www.cnil.fr/fr/ma-conformite-au-rgpd/me-mettre-en-conformite)
- [CNIL - Les six grands principes du RGPD](https://www.cnil.fr/fr/comprendre-le-rgpd/les-six-grands-principes-du-rgpd)
- [CNIL - Informer les personnes concernees dans le contexte de l'IA](https://cnil.fr/fr/ia-informer-les-personnes-concernees)
- [Reglement (UE) 2016/679 (RGPD)](https://eur-lex.europa.eu/eli/reg/2016/679/oj?locale=fr)

