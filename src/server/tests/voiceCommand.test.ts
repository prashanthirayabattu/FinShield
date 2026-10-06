import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractAmount,
  extractCategory,
  parseVoiceIntent,
  LANGUAGE_LOCALE_MAP,
} from '../../src/utils/voiceCommandParser';

test('FinShield Milestone 12 — Voice Mode Intent & Safety Verification Suite', async (t) => {
  await t.test('VOICE-01: Language locale mapping correctly maps to Indian regional locales', () => {
    assert.equal(LANGUAGE_LOCALE_MAP['en'], 'en-IN');
    assert.equal(LANGUAGE_LOCALE_MAP['te'], 'te-IN');
    assert.equal(LANGUAGE_LOCALE_MAP['hi'], 'hi-IN');
  });

  await t.test('VOICE-02: Amount extraction parses plain numbers, formatted amounts, and currency symbols', () => {
    assert.equal(extractAmount('500'), 500);
    assert.equal(extractAmount('₹1,500 for groceries'), 1500);
    assert.equal(extractAmount('Add expense of 25000 rs'), 25000);
    assert.equal(extractAmount('ఫుడ్ కోసం 750 రూపాయలు'), 750);
    assert.equal(extractAmount('खाने के लिए 1200 रुपये'), 1200);
    assert.equal(extractAmount('No amount mentioned here'), null);
    assert.equal(extractAmount('-500'), null);
    assert.equal(extractAmount('0'), null);
  });

  await t.test('VOICE-03: Category extraction maps terms across English, Telugu, and Hindi', () => {
    assert.equal(extractCategory('grocery shopping at supermarket'), 'Food');
    assert.equal(extractCategory('భోజనం కోసం ఖర్చు'), 'Food');
    assert.equal(extractCategory('खाना और राशन'), 'Food');

    assert.equal(extractCategory('petrol fuel for car'), 'Transport');
    assert.equal(extractCategory('క్యాబ్ రవాణా చార్జీలు'), 'Transport');
    assert.equal(extractCategory('टैक्सी और बस किराया'), 'Transport');

    assert.equal(extractCategory('flat rent payment'), 'Housing');
    assert.equal(extractCategory('ఇంటి అద్దె చెల్లించాను'), 'Housing');
    assert.equal(extractCategory('मकान का किराया'), 'Housing');

    assert.equal(extractCategory('electricity and wifi bill'), 'Utilities');
    assert.equal(extractCategory('కరెంట్ బిల్లు'), 'Utilities');
    assert.equal(extractCategory('बिजली का बिल'), 'Utilities');

    assert.equal(extractCategory('doctor consultation and medicines'), 'Healthcare');
    assert.equal(extractCategory('ఆసుపత్రి మందులు'), 'Healthcare');
    assert.equal(extractCategory('डॉक्टर और दवा'), 'Healthcare');
  });

  await t.test('VOICE-04: Navigation commands map to valid application views across EN, TE, HI', () => {
    assert.deepEqual(parseVoiceIntent('go to dashboard', 'en'), { type: 'NAVIGATION', view: 'dashboard' });
    assert.deepEqual(parseVoiceIntent('డాష్‌బోర్డ్‌కి వెళ్ళు', 'te'), { type: 'NAVIGATION', view: 'dashboard' });
    assert.deepEqual(parseVoiceIntent('डैशबोर्ड खोलो', 'hi'), { type: 'NAVIGATION', view: 'dashboard' });

    assert.deepEqual(parseVoiceIntent('open transactions', 'en'), { type: 'NAVIGATION', view: 'transactions' });
    assert.deepEqual(parseVoiceIntent('లావాదేవీలు చూపించు', 'te'), { type: 'NAVIGATION', view: 'transactions' });
    assert.deepEqual(parseVoiceIntent('लेनदेन खोलो', 'hi'), { type: 'NAVIGATION', view: 'transactions' });

    assert.deepEqual(parseVoiceIntent('show budgets', 'en'), { type: 'NAVIGATION', view: 'budgets' });
    assert.deepEqual(parseVoiceIntent('బడ్జెట్‌లు చూపించు', 'te'), { type: 'NAVIGATION', view: 'budgets' });
    assert.deepEqual(parseVoiceIntent('बजट दिखाओ', 'hi'), { type: 'NAVIGATION', view: 'budgets' });

    assert.deepEqual(parseVoiceIntent('open scamshield', 'en'), { type: 'NAVIGATION', view: 'scamshield' });
    assert.deepEqual(parseVoiceIntent('స్కామ్‌షీల్డ్ ఓపెన్ చేయి', 'te'), { type: 'NAVIGATION', view: 'scamshield' });
    assert.deepEqual(parseVoiceIntent('स्कैमशील्ड खोलो', 'hi'), { type: 'NAVIGATION', view: 'scamshield' });

    assert.deepEqual(parseVoiceIntent('open security center', 'en'), { type: 'NAVIGATION', view: 'security' });
    assert.deepEqual(parseVoiceIntent('భద్రతా కేంద్రం చూపించు', 'te'), { type: 'NAVIGATION', view: 'security' });
    assert.deepEqual(parseVoiceIntent('सुरक्षा केंद्र खोलो', 'hi'), { type: 'NAVIGATION', view: 'security' });
  });

  await t.test('VOICE-05: SAFETY GATE — Transaction creation extracts details and MANDATES explicit confirmation', () => {
    const enTx = parseVoiceIntent('Add an expense of 500 for food', 'en');
    assert.equal(enTx.type, 'TRANSACTION_CREATE');
    if (enTx.type === 'TRANSACTION_CREATE') {
      assert.equal(enTx.transactionType, 'EXPENSE');
      assert.equal(enTx.amount, 500);
      assert.equal(enTx.category, 'Food');
      assert.equal(enTx.requiresConfirmation, true, 'CRITICAL: Must require explicit confirmation');
    }

    const teTx = parseVoiceIntent('ఫుడ్ కోసం 750 రూపాయల ఖర్చు నమోదు చేయి', 'te');
    assert.equal(teTx.type, 'TRANSACTION_CREATE');
    if (teTx.type === 'TRANSACTION_CREATE') {
      assert.equal(teTx.transactionType, 'EXPENSE');
      assert.equal(teTx.amount, 750);
      assert.equal(teTx.category, 'Food');
      assert.equal(teTx.requiresConfirmation, true, 'CRITICAL: Must require explicit confirmation');
    }

    const hiTx = parseVoiceIntent('वेतन के रूप में 45000 की आय जोड़ो', 'hi');
    assert.equal(hiTx.type, 'TRANSACTION_CREATE');
    if (hiTx.type === 'TRANSACTION_CREATE') {
      assert.equal(hiTx.transactionType, 'INCOME');
      assert.equal(hiTx.amount, 45000);
      assert.equal(hiTx.category, 'Salary');
      assert.equal(hiTx.requiresConfirmation, true, 'CRITICAL: Must require explicit confirmation');
    }
  });

  await t.test('VOICE-06: SAFETY GATE — Budget mutation extracts details and MANDATES explicit confirmation', () => {
    const enBudget = parseVoiceIntent('Set my food budget to 5000', 'en');
    assert.equal(enBudget.type, 'BUDGET_SET');
    if (enBudget.type === 'BUDGET_SET') {
      assert.equal(enBudget.category, 'Food');
      assert.equal(enBudget.amount, 5000);
      assert.equal(enBudget.requiresConfirmation, true, 'CRITICAL: Must require explicit confirmation');
    }

    const teBudget = parseVoiceIntent('ఫుడ్ బడ్జెట్ 8000 గా సెట్ చేయి', 'te');
    assert.equal(teBudget.type, 'BUDGET_SET');
    if (teBudget.type === 'BUDGET_SET') {
      assert.equal(teBudget.category, 'Food');
      assert.equal(teBudget.amount, 8000);
      assert.equal(teBudget.requiresConfirmation, true, 'CRITICAL: Must require explicit confirmation');
    }
  });

  await t.test('VOICE-07: Informational queries (Read summary & budget query) are answered safely without mutation', () => {
    const summaryEn = parseVoiceIntent('Read my financial summary', 'en');
    assert.deepEqual(summaryEn, { type: 'READ_SUMMARY', target: 'dashboard' });

    const summaryTe = parseVoiceIntent('నా ఆర్థిక సారాంశం చదువు', 'te');
    assert.deepEqual(summaryTe, { type: 'READ_SUMMARY', target: 'dashboard' });

    const summaryHi = parseVoiceIntent('मेरा वित्तीय सारांश पढ़ो', 'hi');
    assert.deepEqual(summaryHi, { type: 'READ_SUMMARY', target: 'dashboard' });

    const budgetQuery = parseVoiceIntent('What is my food budget?', 'en');
    assert.equal(budgetQuery.type, 'BUDGET_QUERY');

    const scamVoice = parseVoiceIntent('Analyze this message: Your electricity bill is pending call 9876543210', 'en');
    assert.equal(scamVoice.type, 'ANALYZE_SCAM');
    if (scamVoice.type === 'ANALYZE_SCAM') {
      assert.ok(scamVoice.message.includes('electricity bill'));
    }
  });

  await t.test('VOICE-08: Confirmation commands parse Yes/No values accurately across languages', () => {
    assert.deepEqual(parseVoiceIntent('yes', 'en'), { type: 'CONFIRMATION', value: true });
    assert.deepEqual(parseVoiceIntent('confirm', 'en'), { type: 'CONFIRMATION', value: true });
    assert.deepEqual(parseVoiceIntent('అవును', 'te'), { type: 'CONFIRMATION', value: true });
    assert.deepEqual(parseVoiceIntent('हाँ', 'hi'), { type: 'CONFIRMATION', value: true });

    assert.deepEqual(parseVoiceIntent('no', 'en'), { type: 'CONFIRMATION', value: false });
    assert.deepEqual(parseVoiceIntent('cancel', 'en'), { type: 'CONFIRMATION', value: false });
    assert.deepEqual(parseVoiceIntent('వద్దు', 'te'), { type: 'CONFIRMATION', value: false });
    assert.deepEqual(parseVoiceIntent('नहीं', 'hi'), { type: 'CONFIRMATION', value: false });
  });

  await t.test('VOICE-09: Financial questions fall back safely to user-scoped AI assistant intent', () => {
    const q1 = parseVoiceIntent('How much money do I have left?', 'en');
    assert.deepEqual(q1, { type: 'FINANCIAL_QUESTION', query: 'How much money do I have left?' });

    const q2 = parseVoiceIntent('ఈ నెల నేను ఎంత ఖర్చు చేశాను?', 'te');
    assert.deepEqual(q2, { type: 'FINANCIAL_QUESTION', query: 'ఈ నెల నేను ఎంత ఖర్చు చేశాను?' });

    const q3 = parseVoiceIntent('मेरा सबसे ज्यादा खर्च किस श्रेणी में है?', 'hi');
    assert.deepEqual(q3, { type: 'FINANCIAL_QUESTION', query: 'मेरा सबसे ज्यादा खर्च किस श्रेणी में है?' });
  });
});
