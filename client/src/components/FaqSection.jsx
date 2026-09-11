import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../i18n/I18nContext';
import { useSettings } from '../context/SettingsContext';

function FaqItem({ q, a, open, onToggle }) {
  return (
    <div className="faq-item">
      <button type="button" className="faq-question" onClick={onToggle} aria-expanded={open}>
        <span>{q}</span>
        <motion.span animate={{ rotate: open ? 45 : 0 }} className="faq-icon">+</motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="faq-answer-wrap"
          >
            <div className="faq-answer">{a}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FaqSection() {
  const { t, lang } = useTranslation();
  const { minAge, maxAge, eventYear } = useSettings();
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = lang === 'en'
    ? [
        { q: 'Who can register?', a: `Anyone between the ages of ${minAge} and ${maxAge} is welcome to join Yuva Prarambhik Varg ${eventYear}.` },
        { q: 'Is there any registration fee?', a: 'No, registration is completely free.' },
        { q: 'What happens after I register?', a: 'You will receive a confirmation email right away. An official will reach out to you with further details.' },
        { q: 'Can I edit my details after registering?', a: 'Please contact the admin team using the details on this page if you need to update anything.' },
        { q: 'I did not receive a confirmation email — what should I do?', a: 'Please check your spam folder first. If it\'s still missing, reach out to us and we\'ll help.' },
      ]
    : [
        { q: 'કોણ નોંધણી કરાવી શકે છે?', a: `${minAge} થી ${maxAge} વર્ષની વયના કોઈપણ વ્યક્તિ યુવા પ્રારંભિક વર્ગ ${eventYear} માં જોડાઈ શકે છે.` },
        { q: 'શું નોંધણી માટે કોઈ ફી છે?', a: 'ના, નોંધણી સંપૂર્ણપણે નિઃશુલ્ક છે.' },
        { q: 'નોંધણી પછી શું થશે?', a: 'તમને તરત જ પુષ્ટિ ઈમેલ મળશે. એક અધિકારી તમારો સંપર્ક કરશે.' },
        { q: 'નોંધણી પછી શું હું મારી વિગતો બદલી શકું?', a: 'કૃપા કરીને કંઈપણ બદલવા માટે એડમિન ટીમનો સંપર્ક કરો.' },
        { q: 'મને પુષ્ટિ ઈમેલ મળ્યો નથી — શું કરવું?', a: 'કૃપા કરીને પહેલા તમારું સ્પામ ફોલ્ડર તપાસો. હજુ પણ ન મળે તો અમારો સંપર્ક કરો.' },
      ];

  return (
    <section className="ys-faq-section" id="ys-faq">
      <h2 className="ys-mission-heading">{lang === 'en' ? 'Frequently Asked Questions' : 'વારંવાર પુછાતા પ્રશ્નો'}</h2>
      <div className="faq-list">
        {faqs.map((f, i) => (
          <FaqItem key={i} q={f.q} a={f.a} open={openIndex === i} onToggle={() => setOpenIndex(openIndex === i ? -1 : i)} />
        ))}
      </div>
    </section>
  );
}
