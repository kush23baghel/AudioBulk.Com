import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ChatgptAdPrompts() {
  const [category, setCategory] = useState('E-commerce');
  const [copiedPrompt, setCopiedPrompt] = useState(null);

  const prompts = {
    'E-commerce': [
      "Act as an expert direct-response copywriter. Write 3 variations of a Facebook ad for [Product Name], which solves [Main Problem]. The tone should be urgent and exciting. Include a strong hook, bullet points of 3 main benefits, and a clear Call to Action to 'Shop Now'. Target audience is [Target Audience].",
      "Write a short, punchy Instagram ad caption for an upcoming flash sale ( [Discount]% off) on our [Product Category]. Focus on the scarcity of the offer and use emojis strategically. End with a CTA linking to our bio.",
      "Create a storytelling-based Facebook ad for [Product Name]. Start with a relatable problem that [Target Audience] faces, introduce our product as the unique solution, and share a brief customer success story. The CTA should encourage them to learn more."
    ],
    'SaaS': [
      "Act as a B2B SaaS copywriter. Write a LinkedIn/Facebook ad targeting [Job Title] who struggle with [Pain Point]. Highlight how our software, [Software Name], saves them [Time/Money]. Use a professional yet conversational tone and a CTA to 'Start Free Trial'.",
      "Write a short, feature-focused ad copy for [SaaS Product]. The key feature we are promoting is [Feature Name], which helps users achieve [Benefit]. Structure it as: Hook -> Feature -> Benefit -> CTA. Keep it under 100 words.",
      "Draft an ad copy aimed at retargeting users who visited our pricing page but didn't sign up. Address potential objections (e.g., price, implementation time) and offer a personalized demo or a [Discount/Offer] for their first month."
    ],
    'Lead Gen': [
      "Write a compelling Facebook ad to promote our free [Lead Magnet Type: eBook/Webinar/Checklist] about [Topic]. The target audience is [Audience]. The ad should make them feel like they are missing out on crucial information if they don't download it. Include a CTA to 'Download Now'.",
      "Create a short, question-based ad copy. Start by asking a qualifying question that only our ideal customer ([Target Audience]) would say 'yes' to. Then offer our [Service/Consultation] as the ultimate answer. End with a CTA to 'Book a Call'.",
      "Write an ad featuring a customer testimonial. Take this quote: '[Insert Quote]' and build a short case study around it. Emphasize the transformation the client experienced after using our service. End with a CTA to get a free quote."
    ],
    'Local Business': [
      "Act as a local marketing expert. Write a Facebook ad for a [Business Type, e.g., Dental Clinic] located in [City/Neighborhood]. Focus on building trust and community connection. Offer a special 'New Customer Special: [Offer]'. The CTA should be 'Book Appointment'.",
      "Write a highly localized, urgency-driven ad for [Business Name]. We are running a weekend special for [Service/Product]. Use local slang or references if applicable, and encourage them to drop by our store at [Address] before we run out of stock.",
      "Create a welcoming, behind-the-scenes style ad copy for our [Business Type]. Introduce the owner/team, explain why we started the business in [City], and invite locals to come in and try our [Signature Product/Service]. Keep it warm, friendly, and authentic."
    ]
  };

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedPrompt(index);
    setTimeout(() => setCopiedPrompt(null), 2000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-sm breadcrumbs text-slate-400">
        <ul>
          <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
          <li><Link to="/all-tools" className="hover:text-white transition-colors">Tools</Link></li>
          <li className="text-sky-600 font-medium">ChatGPT Ad Prompts</li>
        </ul>
      </div>

      <div className="flex items-center gap-3 border-b border-white/10 pb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-200 text-sky-600">
          <i className="fa-solid fa-robot text-lg"></i>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">ChatGPT Ad Prompts</h1>
          <p className="text-slate-400 text-sm">High-converting prompt templates for AI-generated ad copy.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar / Filters */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-card p-6 rounded-2xl border border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">Select Category</h2>
            <div className="flex flex-col space-y-2">
              {Object.keys(prompts).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`text-left px-4 py-3 rounded-xl transition-all ${
                    category === cat 
                      ? 'bg-sky-500 text-white font-medium shadow-md shadow-sky-500/20' 
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          
          <div className="glass-card p-6 rounded-2xl border border-white/10 bg-sky-500/5">
            <h3 className="font-semibold text-white mb-2 text-sm"><i className="fa-solid fa-circle-info text-sky-600 mr-2"></i>How to use</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Copy these prompts and paste them into ChatGPT or Claude. Replace the bracketed text like <strong>[Product Name]</strong> with your actual details before generating.
            </p>
          </div>
        </div>

        {/* Main Content / Prompts */}
        <div className="lg:col-span-3 space-y-6">
          <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
            {category} Prompts
          </h2>
          
          <div className="space-y-4">
            {prompts[category].map((prompt, index) => (
              <div key={index} className="glass-card p-6 rounded-2xl border border-white/10 relative group transition-all hover:border-sky-300 hover:shadow-lg hover:shadow-sky-500/5">
                <p className="text-slate-300 text-sm leading-relaxed pr-12 whitespace-pre-wrap font-mono">
                  {prompt}
                </p>
                <button
                  onClick={() => handleCopy(prompt, index)}
                  className="absolute top-4 right-4 p-2 rounded-lg bg-slate-100 text-slate-400 hover:text-sky-400 hover:bg-slate-200 transition-colors tooltip tooltip-left"
                  data-tip={copiedPrompt === index ? 'Copied!' : 'Copy Prompt'}
                >
                  <i className={`fa-solid ${copiedPrompt === index ? 'fa-check text-emerald-600' : 'fa-copy'}`}></i>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
