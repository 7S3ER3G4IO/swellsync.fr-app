
const legalContents = {
    'cgv': `
        <div class="mb-12 border-b border-white/10 pb-8">
            <span class="text-primary font-bold tracking-widest uppercase text-xs mb-2 block">Document Légal
                Officiel</span>
            <h2 class="text-4xl md:text-5xl font-black mb-4">Conditions Générales <br /><span class="text-primary">de
                    Vente (CGV)</span></h2>
            <p class="text-slate-400 font-medium">Dernière mise à jour : 21 Février 2026. <br />Applicables à tous les
                utilisateurs de l'application SWELLSYNC.</p>
        </div>

        <div
            class="prose prose-invert prose-p:text-slate-400 prose-headings:text-white prose-a:text-primary max-w-none">

            <h3 class="text-2xl font-bold mt-8 mb-4">1. Objet du Contrat</h3>
            <p>Les présentes Conditions Générales de Vente (CGV) régissent l'abonnement et l'utilisation des services
                premium proposés par la société SwellSync Technology (ci-après "le Service") via son site web et ses
                applications mobiles.</p>
            <p>La souscription à l'abonnement "SWELLSYNC PRO", permettant notamment l'accès sans limite aux caméras HD
                et aux modèles haute précision à longue portée (15 jours), implique l'adhésion sans réserve aux présentes CGV.</p>

            <h3 class="text-2xl font-bold mt-8 mb-4">2. Offre et Tarification</h3>
            <p>SwellSync propose un abonnement unique, nommé "SWELLSYNC PRO", facturé sous forme de mensualités ou de
                prélèvement annuel, tel que décrit sur la page de paiement avant confirmation.</p>
            <ul class="list-disc pl-6 text-slate-400 mt-4 space-y-2">
                <li>Le prix affiché lors du paiement inclut les taxes applicables selon votre pays de résidence.</li>
                <li>Le montant est prélevé de manière récurrente à la date anniversaire de la souscription.</li>
                <li>SwellSync se réserve le droit de modifier ses tarifs à l'avenir, mais le tarif actif d'un client au
                    moment de sa souscription restera inchangé pour toute la durée ininterrompue de son abonnement.</li>
            </ul>

            <h3 class="text-2xl font-bold mt-8 mb-4">3. Accès aux Caméras HD & Données Avancées</h3>
            <p>L'abonnement "PRO" octroie une licence individuelle, personnelle et non transférable. Le partage
                d'identifiants entre plusieurs utilisateurs est strictement interdit. Nos systèmes détectent
                automatiquement les multi-connexions simultanées sur un unique compte VIP.</p>
            <p>En cas de violation constatée, SwellSync Technology est habilitée à suspendre définitivement ledit
                compte, sans possibilité de remboursement.</p>

            <h3 class="text-2xl font-bold mt-8 mb-4">4. Disponibilité du Service "99.9% Uptime"</h3>
            <p>SwellSync s'engage à faire ses meilleurs efforts pour garantir l'accessibilité continue aux données
                météo. Toutefois, concernant le réseau privé de Caméras HD :</p>
            <ul class="list-disc pl-6 text-slate-400 mt-4 space-y-2">
                <li>Ces flux dépendent d'installations matérielles exposées aux éléments naturels (embruns, vent,
                    foudre).</li>
                <li>SwellSync ne peut garantir une couverture vidéo garantie à 100% sur un spot particulier à l'instant
                    T. Une panne matérielle locale nécessitant une intervention physique ne constitue pas un motif de
                    remboursement intégral de l'abonnement global.</li>
            </ul>

            <h3 class="text-2xl font-bold mt-8 mb-4">5. Droit de Rétractation et Résiliation</h3>
            <p>Conformément au Code de la consommation, puisque vous obtenez immédiatement accès au service dès le
                paiement complété, le droit de rétractation de 14 jours ne s'applique pas au téléchargement de notre
                contenu numérique par nature.</p>
            <p><strong>Résiliation :</strong> SWELLSYNC PRO est SANS ENGAGEMENT. Vous êtes libre de mettre fin à votre
                renouvellement mensuel directement depuis la rubrique "Mon Compte", d'un simple clic. Tout mois entamé
                est cependant dû et restera fonctionnel jusqu'à son échéance.</p>

            <h3 class="text-2xl font-bold mt-8 mb-4">6. Compétence Juridictionnelle</h3>
            <p>Ces conditions et l'ensemble de vos activités via SwellSync relèvent de la loi française. En cas de
                litige ne pouvant se régler préalablement à l'amiable avec notre support, les tribunaux compétents
                seront ceux de l'arrondissement du siège social (Hossegor, Landes).</p>
        </div>

        <div class="mt-16 bg-white/5 p-6 rounded-2xl border border-white/10 flex items-center justify-between">
            <p class="text-sm text-slate-400">Pour toute question commerciale, contactez notre équipe francophone :</p>
            <a href="mailto:support@swellsync.com"
                class="bg-primary text-background-dark font-black px-4 py-2 rounded-lg text-xs uppercase tracking-widest hover:bg-white transition-colors">Support
                Client</a>
        </div>
    `,
    'privacy': `
        <div class="mb-12 border-b border-white/10 pb-8">
            <span class="text-primary font-bold tracking-widest uppercase text-xs mb-2 block">Données
                Personnelles</span>
            <h2 class="text-4xl md:text-5xl font-black mb-4">Politique de <br /><span
                    class="text-primary">Confidentialité (RGPD)</span></h2>
            <p class="text-slate-400 font-medium">Nous protégeons vos données comme notre spot secret. <br />Mise en
                conformité avec le Règlement Général sur la Protection des Données (RGPD).</p>
        </div>

        <div
            class="prose prose-invert prose-p:text-slate-400 prose-headings:text-white prose-a:text-primary max-w-none">

            <h3 class="text-2xl font-bold mt-8 mb-4">1. Qui collecte vos données ?</h3>
            <p>La plateforme SwellSync est éditée et régie par SWELLSYNC TECHNOLOGY SAS. Nous agissons en tant que
                Responsable de Traitement pour toutes les données que vous nous confiez en créant un compte ou en
                naviguant sur notre carte.</p>

            <h3 class="text-2xl font-bold mt-8 mb-4">2. Quelles données collectons-nous et pourquoi ?</h3>
            <p>Nous ne collectons que ce qui est strictement nécessaire pour faire fonctionner notre intelligence
                artificielle météo de manière personnalisée pour vous :</p>
            <ul class="list-disc pl-6 text-slate-400 mt-4 space-y-2">
                <li><strong>Données d'identité (Compte) :</strong> Nom, prénom, adresse e-mail. Requis pour la création
                    de profil, la facturation de l'abonnement PRO, et l'envoi des rapports météo "Alerte Swell".</li>
                <li><strong>Données de Géolocalisation (Application Locale) :</strong> Position GPS approximative.
                    Utilisé EXCLUSIVEMENT pour vous centrer sur la carte des spots à louverture de l'application. Cette
                    donnée ne remonte jamais sur nos serveurs sans votre accord explicite sur le navigateur.</li>
                <li><strong>Données Comportementales :</strong> "Spots Favoris", "Caméras les plus regardées". Utilisé
                    par notre système pour vous envoyer une notification push personnalisée quand les conditions idéales se
                    présentent sur VOS spots.</li>
                <li><strong>Données de Paiement :</strong> Vos coordonnées bancaires (Cagnotte) ne transitent JAMAIS par
                    nos serveurs, mais directement chez notre prestataire de paiement ultra-sécurisé (Ex: Stripe).</li>
            </ul>

            <h3 class="text-2xl font-bold mt-8 mb-4">3. Durée de conservation</h3>
            <p>Vos données de compte sont gardées tant que ce dernier est actif. Après 3 ans d'inactivité totale sur
                SwellSync, nous vous enverrons un email. Sans réponse, toutes vos données (favoris, email) seront
                anonymisées ou purgées définitivement (Droit à l'oubli).</p>

            <h3 class="text-2xl font-bold mt-8 mb-4">4. Partage des données à des Tiers</h3>
            <p><strong>C'est très simple : Nous ne vendons, ni ne louons vos données. Jamais.</strong> Elles ne sont
                partagées qu'avec nos sous-traitants techniques directs et audités (Hébergeur Cloud Sécurisé, Système
                d'Emailing Transactionnel, Prestataire de paiement) nécessaires à la survie de votre application.</p>

            <h3 class="text-2xl font-bold mt-8 mb-4">5. Sécurité de Pointe (Nos Serveurs)</h3>
            <p>Les serveurs SwellSync sont protégés par des protocoles cryptographiques industriels (Bcrypt pour les
                mots de passe, TLS 1.3, Headers HTTP stricts, Rate-Limiting anti-DDoS). L'équipe fondatrice a mis la
                sécurité au cœur de son infrastructure.</p>

            <h3 class="text-2xl font-bold mt-8 mb-4">6. Vos Droits (Vos Datas, Vos Règles)</h3>
            <p>Conformément au droit Européen vous possédez :</p>
            <ul class="list-disc pl-6 text-slate-400 mt-4 space-y-2">
                <li>Un droit d'Accès (savoir ce qu'on sait sur vous).</li>
                <li>Un droit de Rectification (modifier vos infos).</li>
                <li>Un droit à l'Effacement (Suppression Totale en 1 Clic depuis votre espace).</li>
                <li>Un droit de Portabilité de l'ensemble de vos analyses de surf en fichier standard.</li>
            </ul>
        </div>

        <div class="mt-16 bg-white/5 p-6 rounded-2xl border border-white/10 flex items-center justify-between">
            <p class="text-sm text-slate-400">Pour exercer la suppression instantanée de vos données, écrivez au DPO
                (Délégué à la protection des données) :</p>
            <a href="mailto:privacy@swellsync.com"
                class="bg-primary text-background-dark font-black px-4 py-2 rounded-lg text-xs uppercase tracking-widest hover:bg-white transition-colors">privacy@swellsync.com</a>
        </div>
    `,
    'legal': `
        <div class="mb-12 border-b border-white/10 pb-8">
            <span class="text-primary font-bold tracking-widest uppercase text-xs mb-2 block">Transparence
                SWELLSYNC</span>
            <h2 class="text-4xl md:text-5xl font-black mb-4">Mentions <br /><span class="text-primary">Légales
                    (LCEN)</span></h2>
            <p class="text-slate-400 font-medium">Informations légales concernant l'éditeur et l'hébergement de cette
                plateforme web & mobile.</p>
        </div>

        <div
            class="prose prose-invert prose-p:text-slate-400 prose-headings:text-white prose-a:text-primary max-w-none">

            <div class="glass p-8 rounded-[2rem] border border-white/5 mb-8">
                <h3 class="text-2xl font-bold mb-4 mt-0 text-white">Éditeur du Site / Propriétaire </h3>
                <p class="mb-2"><strong>Raison sociale :</strong> SWELLSYNC TECHNOLOGY S.A.S</p>
                <p class="mb-2"><strong>Capital social :</strong> 10 000,00 Euros</p>
                <p class="mb-2"><strong>Siège social :</strong> Pépinière d'entreprise Pédebert, Avenue des Tisserands,
                    40150 Soorts-Hossegor, FRANCE.</p>
                <p class="mb-2"><strong>RCS (Registre du Commerce et des Sociétés) :</strong> Dax B 999 999 999</p>
                <p class="mb-2"><strong>N° de TVA Intracommunautaire :</strong> FR 99 999 999 999</p>
                <p class="mb-4"><strong>Numéro de Téléphone :</strong> +33 (0)5 99 99 99 99 (Non surtaxé, du Lun au Ven
                    - 9h-18h)</p>
                <p><strong>Directeur de la Publication :</strong> Max, Gérant-Fondateur.</p>
            </div>

            <h3 class="text-2xl font-bold mt-8 mb-4">Hébergement des Services</h3>
            <p>Afin de garantir une disponibilité de 99.9% et des latences de 5ms, les serveurs de production (Base de
                Données, API Météo, Application) et le réseau sont gérés par de prestataires cloud ultra-sécurisés.</p>
            <p>
                <strong>L'infrastructure informatique mère est localisée exclusivement en Union Européenne chez
                    :</strong><br />
                AWS Ireland (Amazon Web Services)<br />
                Burlington Plaza, Burlington Road, Dublin 4, Irlande
            </p>

            <h3 class="text-2xl font-bold mt-8 mb-4">Propriété Intellectuelle (Copyright)</h3>
            <p>L'ensemble de ce site et de cette application (Base de données des 60 Spots, Codes Sources, Intelligence
                Artificielle Prévisionnelle, API Custom Swagger, Design UI Glassmorphism, Logotype SwellSync) relève de
                la législation française et internationale sur le droit d’auteur et la propriété intellectuelle.</p>
            <p><strong>Toute reproduction, représentation, modification, publication, adaptation totale ou
                    partielle</strong> des éléments du site, quel que soit le moyen ou le procédé utilisé, "scrapping"
                du site inclus, est loggé, repéré techniquement et formellement interdite sans l'autorisation écrite
                préalable de SWELLSYNC TECHNOLOGY.</p>

        </div>
    `,
    'cookies': `
        <div class="mb-12 border-b border-white/10 pb-8">
            <span class="text-primary font-bold tracking-widest uppercase text-xs mb-2 block">Préférences
                Utilisateur</span>
            <h2 class="text-4xl md:text-5xl font-black mb-4">Gérer mes <br /><span class="text-primary">Traceurs
                    (Cookies)</span></h2>
            <p class="text-slate-400 font-medium">Contrôlez finement l'empreinte numérique que vous laissez sur la
                plateforme.</p>
        </div>

        <div
            class="prose prose-invert prose-p:text-slate-400 prose-headings:text-white prose-a:text-primary max-w-none">

            <p class="text-lg">Lors de votre consultation de l'application SwellSync, des informations relatives à votre
                navigation sont susceptibles d'être enregistrées dans des fichiers "Cookies", installés sur votre
                terminal (Smartphone, PC, Tablette).</p>
            <p class="mb-8">Nous avons fait le choix de la transparence et d'une conception "Privacy by Design" :
                <strong>Nous n'utilisons aucun traceur publicitaire intrusif.</strong>
            </p>

            <h3 class="text-2xl font-bold mt-8 mb-4">Vos Préférences Globales</h3>
            <div class="space-y-4">

                <!-- Option 1 : Toujours Actif -->
                <div
                    class="glass p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            <span class="material-symbols-outlined text-green-400">check_circle</span>
                            <h4 class="font-bold text-white text-lg m-0 leading-none">Cookies Techniques Strictly
                                Nécessaires</h4>
                        </div>
                        <p class="text-sm text-slate-400 m-0">Indispensables au site pour fonctionner (Sauvegarder
                            l'état sombre, conserver votre Panier VIP PRO, maintenir votre connexion via 'JSON Web
                            Token' sans vous déconnecter à chaque clic sur la carte).</p>
                    </div>
                    <div class="shrink-0">
                        <span
                            class="text-[10px] text-background-dark font-black uppercase tracking-widest px-3 py-1 rounded bg-slate-300">Toujours
                            Actif</span>
                    </div>
                </div>

                <!-- Option 2 : Optionnel -->
                <div
                    class="glass p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-primary/30 transition-colors">
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            <span class="material-symbols-outlined text-primary">analytics</span>
                            <h4 class="font-bold text-white text-lg m-0 leading-none">Cookies de Performance
                                d'Intelligence Artificielle</h4>
                        </div>
                        <p class="text-sm text-slate-400 m-0">Aide notre équipe (statistiques anonymisées) à savoir
                            "Quels sont les 60 Spots les plus consultés hier ?", pour allouer aux serveurs Leaflet de la
                            puissance serveur avant un très gros week-end.</p>
                    </div>
                    <div class="shrink-0">
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked class="sr-only peer">
                            <div
                                class="w-14 h-7 bg-background-dark rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-slate-400 peer-checked:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary border border-white/20">
                            </div>
                        </label>
                    </div>
                </div>

                <!-- Option 3 : Optionnel -->
                <div
                    class="glass p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-primary/30 transition-colors">
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            <span class="material-symbols-outlined text-orange-400">tune</span>
                            <h4 class="font-bold text-white text-lg m-0 leading-none">Cookies de Fonctionnalités &
                                Cartographie</h4>
                        </div>
                        <p class="text-sm text-slate-400 m-0">Mémorise votre comportement sur la "Carte Leaflet" : Sur
                            quel niveau de Zoom Micro êtes vous resté en quittant l'App ? Quel "Filtre" pour les graphs
                            de vent avez-vous activé hier ?</p>
                    </div>
                    <div class="shrink-0">
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked class="sr-only peer">
                            <div
                                class="w-14 h-7 bg-background-dark rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-slate-400 peer-checked:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary border border-white/20">
                            </div>
                        </label>
                    </div>
                </div>

            </div>

            <button
                class="w-full mt-8 bg-primary/10 hover:bg-primary text-primary hover:text-background-dark transition-all duration-300 py-4 rounded-xl font-black uppercase tracking-widest border border-primary/30"
                onclick="alert('Vos préférences viennent d\'être sauvegardées sur votre terminal courant.')">
                Sauvegarder mes Préférences
            </button>
            <p class="text-xs text-center mt-3 text-slate-500">Un Cookie de session valide pendant 6 mois sera posé pour
                retenir ce choix actuel.</p>

        </div>
    `,
};

function openLegalModal(type) {
    console.log("Opening legal modal for:", type);
    const backdrop = document.getElementById('legal-modal-backdrop');
    const contentDiv = document.getElementById('legal-modal-content');
    const container = document.getElementById('legal-modal-container');

    if (!backdrop || !contentDiv) return;

    contentDiv.innerHTML = legalContents[type] || 'Contenu introuvable';

    // Show modal
    backdrop.classList.remove('hidden');
    backdrop.classList.add('flex');

    // Animation
    setTimeout(() => {
        backdrop.classList.remove('opacity-0');
        container.classList.remove('scale-95');
        container.classList.add('scale-100');
    }, 10);
}

function closeLegalModal() {
    const backdrop = document.getElementById('legal-modal-backdrop');
    const container = document.getElementById('legal-modal-container');

    if (!backdrop) return;

    // Animation
    backdrop.classList.add('opacity-0');
    container.classList.remove('scale-100');
    container.classList.add('scale-95');

    setTimeout(() => {
        backdrop.classList.remove('flex');
        backdrop.classList.add('hidden');
    }, 300);
}
