import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="nav-glass rounded-2xl p-8 md:p-12 border border-white/5">
          <h1 className="font-sora text-3xl md:text-4xl font-bold text-white mb-8">Privacy Policy</h1>
          
          <div className="space-y-8 text-slate-300 font-inter leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">1. Our Core Privacy Principle: Local Processing</h2>
              <p>
                At AudioBulk, privacy is not an afterthought; it is the foundation of our architecture. 
                <strong> Almost all media processing (Audio, Video, GIF, Image) happens entirely locally on your device.</strong>
              </p>
              <p className="mt-2">
                We use WebAssembly (WASM) and modern browser APIs to process your files directly within your browser. 
                This means your sensitive media files are <strong>never uploaded to our servers</strong>, never stored in the cloud, and never accessible to us or any third party.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">2. AI Tools and External APIs</h2>
              <p>
                AudioBulk includes a suite of AI-powered text generators. To provide these services, we integrate with third-party LLM providers (such as OpenRouter).
              </p>
              <p className="mt-2">
                When you use our AI tools, the text prompts you enter are sent to the configured API provider to generate the response. 
                Your API keys (if provided locally) are stored only in your browser's local storage or your local environment and are never transmitted to AudioBulk servers.
                Please review the privacy policies of the respective AI models (e.g., Meta, Anthropic, Google) regarding how they handle prompt data.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">3. Data Collection and Usage</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Personal Information:</strong> We do not require you to create an account, provide an email address, or share any personal identity information to use AudioBulk.</li>
                <li><strong>Usage Analytics:</strong> We may collect anonymous, aggregated usage statistics (such as page views or tool popularity) to help us improve the platform. This data contains no personally identifiable information.</li>
                <li><strong>Cookies:</strong> We use minimal local storage (like cookies or localStorage) solely to save your preferences (e.g., theme choice, local API keys) so you have a seamless experience across sessions.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">4. Third-Party Services</h2>
              <p>
                AudioBulk may contain links to third-party websites or use third-party CDNs (like Google Fonts or FontAwesome) to deliver assets. These services may collect IP addresses as part of their standard web serving process.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">5. Changes to This Policy</h2>
              <p>
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">6. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us through our official channels.
              </p>
            </section>
            
            <div className="pt-8 mt-8 border-t border-white/10 flex justify-end">
              <Link to="/" className="btn-primary-glow px-6 py-2.5 rounded-xl font-semibold text-sm">
                Return Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
