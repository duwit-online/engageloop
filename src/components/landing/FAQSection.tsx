import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'Is EngageLoop safe to use?',
    answer: 'Absolutely! EngageLoop uses 100% human-powered engagement. We never use bots, automation, or access your social media accounts. All activities are performed manually by real community members.',
  },
  {
    question: 'What are Capsules?',
    answer: 'Capsules are our internal currency. You earn Capsules by engaging with other users\' content (likes, comments, follows, streams) and spend them to get engagement on your own content.',
  },
  {
    question: 'What platforms are supported?',
    answer: 'We support any public URL! This includes Facebook, Instagram, X (Twitter), YouTube, TikTok, LinkedIn, Spotify, SoundCloud, GitHub, and many more. If it\'s a public link, you can share it.',
  },
  {
    question: 'How do I earn Capsules?',
    answer: 'Complete engagement tasks for other users: Like = 5 Capsules, Comment = 10 Capsules, Follow = 15 Capsules, Stream/Watch = 15 Capsules. Complete all tasks for a combo bonus of +15 Capsules!',
  },
  {
    question: 'Can I get banned for using EngageLoop?',
    answer: 'No. Since all engagements are performed by real humans manually, there\'s no violation of any platform\'s terms of service. It\'s just like sharing your content with friends who genuinely engage.',
  },
  {
    question: 'What\'s the difference between Free and Premium?',
    answer: 'Premium users get 6,000 monthly Capsules (vs 1,500), a 1.5x earning multiplier, no daily spending limits, ad-free experience, batch tasks, and priority support.',
  },
  {
    question: 'How is engagement verified?',
    answer: 'We use task timers, confirmation steps, optional screenshot uploads, and a trust score system. Random manual reviews ensure quality, and repeated offenders are restricted.',
  },
  {
    question: 'Can I buy more Capsules?',
    answer: 'Yes! Visit our store to purchase Capsule packages. Options range from 100 Capsules (₦500) to 1,500 Capsules (₦5,000 - Best Value).',
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="py-20 sm:py-32 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about EngageLoop.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border border-border/50 rounded-xl px-6 bg-card"
              >
                <AccordionTrigger className="text-left hover:no-underline py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
