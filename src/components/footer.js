export const renderSiteFooter = (target) => {
  if (!target) return;

  target.innerHTML = `
    <div class="bottom-stack">
      <section class="newsletter" aria-label="Newsletter signup">
        <div class="newsletter-copy"><h2>Stay in touch</h2><p>Get updates on new episodes and special features.</p></div>
        <form class="newsletter-form" data-newsletter-form>
          <label class="sr-only" for="email">Your email address</label>
          <input id="email" name="email" type="email" placeholder="Your email address" />
          <button type="submit">Subscribe</button>
        </form>
        <img class="newsletter-cat" src="/assets/images/cat-blk.png" alt="" />
      </section>

      <footer class="site-footer">
        <a class="footer-brand placeholder-link" href="#" aria-label="CBS Radio Mystery Theater home"><img src="/assets/images/cbsrmt2-wht.png" alt="CBS Radio Mystery Theater" /></a>
        <div class="footer-social" aria-label="Social links placeholders">
          <a class="social-link placeholder-link" href="#" aria-label="Facebook"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.7 22v-9h3l.5-3.5h-3.5V7.3c0-1 .3-1.7 1.8-1.7h1.9V2.5c-.3 0-1.5-.1-2.8-.1-2.8 0-4.7 1.7-4.7 4.8v2.3H6.8V13h3.1v9h3.8z"/></svg></a>
          <a class="social-link placeholder-link" href="#" aria-label="X"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.9 2H22l-6.8 7.8L23 22h-6.1l-4.8-6.3L6.6 22H3.5l7.1-8.1L3.1 2h6.2l4.3 5.7L18.9 2zm-1.1 17.9h1.7L8.4 4h-1.8l11.2 15.9z"/></svg></a>
          <a class="social-link placeholder-link" href="#" aria-label="Instagram"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" ry="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.5" cy="6.7" r="1"/></svg></a>
          <a class="social-link placeholder-link" href="#" aria-label="YouTube"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 12s0-3.3-.4-4.8a2.7 2.7 0 0 0-1.9-1.9C18.2 5 12 5 12 5s-6.2 0-7.7.3a2.7 2.7 0 0 0-1.9 1.9C2 8.7 2 12 2 12s0 3.3.4 4.8a2.7 2.7 0 0 0 1.9 1.9C5.8 19 12 19 12 19s6.2 0 7.7-.3a2.7 2.7 0 0 0 1.9-1.9C22 15.3 22 12 22 12z"/><path class="youtube-play" d="m10 9 5 3-5 3z"/></svg></a>
        </div>
        <img class="until-art" src="/assets/images/until-wht.png" alt="Until next time... pleasant... dreams?" />
      </footer>
    </div>`;
};
