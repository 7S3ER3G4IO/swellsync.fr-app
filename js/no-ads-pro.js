/**
 * SwellSync — Désactiver les pubs pour les utilisateurs Pro
 * À insérer dans les pages app avant le script AdSense
 */
(async function() {
  // Vérifier si l'utilisateur est Pro
  try {
    if (typeof supabase === 'undefined') return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data: member } = await supabase.from('members')
      .select('is_pro')
      .eq('auth_id', user.id)
      .single();
    
    if (member?.is_pro) {
      // Masquer toutes les publicités
      const style = document.createElement('style');
      style.id = 'no-ads-pro';
      style.textContent = '.ad-container, .adsbygoogle, #adsense-anchor, [data-ad-slot] { display: none !important; }';
      document.head.appendChild(style);
      
      // Désactiver les requêtes AdSense
      window.adsbygoogle = { push: () => {} };
    }
  } catch(e) {}
})();
