import { Link } from 'react-router-dom';

export default function TermsOfService() {
  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="nav-glass rounded-2xl p-8 md:p-12 border border-white/5">
          <h1 className="font-sora text-3xl md:text-4xl font-bold text-white mb-8">Terms of Service</h1>
          
          <div className="space-y-8 text-slate-300 font-inter leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing and using AudioBulk ("the Platform"), you accept and agree to be bound by the terms and provision of this agreement. 
                If you do not agree to abide by these terms, please do not use the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">2. Description of Service</h2>
              <p>
                AudioBulk provides a collection of browser-based tools for media processing (audio, video, images), AI generation, and various utilities. 
                The tools are provided "as is" and "as available". We reserve the right to modify, suspend, or discontinue any tool or the entire platform at any time without notice.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">3. Local Processing and Data Responsibility</h2>
              <p>
                Most media processing on AudioBulk occurs locally within your web browser. 
                Because files are not uploaded to our servers, you are solely responsible for ensuring you have backup copies of your original files. 
                We are not liable for any data loss, file corruption, or damage that occurs during or after processing using our tools.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">4. Appropriate Use</h2>
              <p>
                You agree not to use AudioBulk to:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Process or distribute illegal, copyrighted, or unauthorized material.</li>
                <li>Generate content that is harmful, harassing, defamatory, or violates any laws using the AI tools.</li>
                <li>Attempt to reverse engineer, hack, or disrupt the operation of the Platform.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">5. Intellectual Property</h2>
              <p>
                The Platform, including its original content, features, and functionality, are owned by AudioBulk and are protected by international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws. 
                You retain all rights and ownership to the media files you process and the content you generate using the tools.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">6. Disclaimer of Warranties</h2>
              <p>
                AudioBulk is provided on an "as is" and "as available" basis. We make no warranties, expressed or implied, and hereby disclaim all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">7. Limitation of Liability</h2>
              <p>
                In no event shall AudioBulk be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on AudioBulk's website.
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
