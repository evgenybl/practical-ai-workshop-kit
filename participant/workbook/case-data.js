/*
 * Practical AI at Work: the case, written once.
 *
 * Everything in this file is invented: the two businesses, every person, every
 * figure, every order. Nothing here describes a real company or a real person.
 *
 * The case's facts live here and nowhere else. The workbook, the checker, the
 * build script (which writes the request files, the answer key and the printable
 * copies of the case), the solutions and the tests all read this file. If a
 * figure has to change, change it here and run: node tools/build.js
 *
 * This is a classic script: the workbook loads it with <script src>, and Node
 * loads it with require(). It attaches itself to globalThis.WorkshopCase.
 */
(function (root) {
  'use strict';

  // ---------------------------------------------------------------------------
  // The figures. Each is written once; the texts below are built from them.
  // ---------------------------------------------------------------------------
  var F = {
    supplier: 'Larkfield Wholesale',
    supplierEmail: 'orders@example.com',
    customer: 'Halden Street Bakery',
    contact: 'Mira Okafor',
    contactFirst: 'Mira',
    contactRole: 'Owner',
    staff: 'Tom Becker',
    staffFirst: 'Tom',
    staffEmail: 'tom.becker@example.com',
    manager: 'Dana Liu',
    managerRole: 'operations manager',

    orderBase: 20398,          // the first order number in the orders table
    orderRow: 19,              // the case's order is row 20 of the table (counting from 0: 19)
    invoiceNo: 'INV-7731',

    cupSize: 12,               // ounces
    cupsOrdered: 40,           // cartons
    lidsOrdered: 20,           // cartons
    cupsDelivered: 34,         // cartons
    cupsCrushed: 6,            // cartons, out of those delivered
    cupPrice: 36.5,            // per carton
    lidPrice: 18,              // per carton (it appears in the published price list, not in the thread)
    localPurchase: 312,        // what the customer spent at a cash-and-carry
    deliveryTime: '10:30',

    staffCreditLimit: 100,     // policy: the largest credit customer service may approve
    damageDays: 2,             // policy: working days to report damage
    missingDays: 5,            // policy: working days to report missing goods
    creditNoteDays: 10,        // policy: working days to issue a credit note after approval
    replyDays: 1,              // policy: working days to answer an e-mail

    dates: {
      placed:    { day: 24, month: 'February', weekday: 'Monday' },
      due:       { day: 28, month: 'February', weekday: 'Friday' },
      msg1:      { day: 3,  month: 'March',    weekday: 'Monday' },
      promised:  { day: 5,  month: 'March',    weekday: 'Wednesday' },
      msg4:      { day: 6,  month: 'March',    weekday: 'Thursday' },
      confirmBy: { day: 7,  month: 'March',    weekday: 'Friday' },
      event:     { day: 8,  month: 'March',    weekday: 'Saturday' },
      msg5:      { day: 11, month: 'March',    weekday: 'Tuesday' }
    }
  };
  F.orderNo = 'SO-' + (F.orderBase + F.orderRow);
  F.cupsMissing = F.cupsOrdered - F.cupsDelivered;
  F.invoiceTotal = F.cupsOrdered * F.cupPrice + F.lidsOrdered * F.lidPrice;
  F.creditDamaged = F.cupsCrushed * F.cupPrice;
  F.creditAsked = F.creditDamaged + F.localPurchase;
  F.contactEmail = emailFor(F.contact);

  // ---------------------------------------------------------------------------
  // Small formatting helpers, used by the texts below.
  // ---------------------------------------------------------------------------
  function money(n) {
    var parts = n.toFixed(2).split('.');
    return '$' + parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + parts[1];
  }
  function dm(d) { return d.day + ' ' + d.month; }
  function wdm(d) { return d.weekday + ' ' + d.day + ' ' + d.month; }
  function shortDate(d) { return d.day + ' ' + d.month.slice(0, 3); }
  function emailFor(name) {
    return name.toLowerCase().replace(/[^a-z ]/g, '').trim().replace(/\s+/g, '.') + '@example.com';
  }

  var D = F.dates;

  // ---------------------------------------------------------------------------
  // The customer e-mail thread: five messages over nine days.
  // ---------------------------------------------------------------------------
  var subject = 'Order ' + F.orderNo + ' has not arrived';
  var thread = [
    {
      n: 1,
      from: F.contact + ', ' + F.customer + ' <' + F.contactEmail + '>',
      to: F.supplier + ', orders <' + F.supplierEmail + '>',
      date: D.msg1,
      subject: subject,
      body: [
        'Hello,',
        'Our order ' + F.orderNo + ', placed on ' + dm(D.placed) + ', was due to be delivered on ' + wdm(D.due) +
          '. It has not arrived, and nobody has told us why. We have a catering job on ' + wdm(D.event) +
          ' and we need these cups and lids for it.',
        'Can you tell me today when the order will come?'
      ],
      sign: [F.contact, F.contactRole + ', ' + F.customer]
    },
    {
      n: 2,
      from: F.staff + ', ' + F.supplier + ' <' + F.staffEmail + '>',
      to: F.contact + ' <' + F.contactEmail + '>',
      date: D.msg1,
      subject: 'Re: ' + subject,
      body: [
        'Hi ' + F.contactFirst + ',',
        'I am sorry for the delay, and that nobody let you know. Your order was held in our warehouse because the lids were out of stock. They came in this morning.',
        'Your order is ' + F.cupsOrdered + ' cartons of ' + F.cupSize + ' oz paper cups and ' + F.lidsOrdered +
          ' cartons of lids. I can confirm that it will be delivered on ' + wdm(D.promised) + ', before noon.'
      ],
      sign: ['Best regards,', F.staff, 'Customer service, ' + F.supplier]
    },
    {
      n: 3,
      from: F.contact + ', ' + F.customer + ' <' + F.contactEmail + '>',
      to: F.staff + ' <' + F.staffEmail + '>',
      date: D.promised,
      subject: 'Re: ' + subject + ' - short and damaged',
      body: [
        F.staffFirst + ',',
        'The delivery came this morning at ' + F.deliveryTime + ', thank you. But it is not right.',
        'We received ' + F.cupsDelivered + ' cartons of cups, not ' + F.cupsOrdered + ', so ' + F.cupsMissing +
          ' are missing. And of the ' + F.cupsDelivered + ' that came, ' + F.cupsCrushed +
          ' were crushed and wet, and we cannot use them. The ' + F.lidsOrdered +
          ' cartons of lids are fine. I have attached photos of the damaged cartons.',
        'Your invoice ' + F.invoiceNo + ' charges us for the full order: ' + money(F.invoiceTotal) + '.',
        'Please send the missing cartons before Saturday, and confirm that you will credit us for the damaged ones.'
      ],
      sign: [F.contactFirst]
    },
    {
      n: 4,
      from: F.staff + ', ' + F.supplier + ' <' + F.staffEmail + '>',
      to: F.contact + ' <' + F.contactEmail + '>',
      date: D.msg4,
      subject: 'Re: ' + subject + ' - short and damaged',
      body: [
        'Hi ' + F.contactFirst + ',',
        'I am sorry about this. I have checked with the warehouse: ' + F.cupsMissing +
          ' cartons of cups were left behind when the van was loaded, and ' + F.cupsCrushed +
          ' were damaged on the way to you.',
        'I cannot get the missing cartons to you before Saturday: our van does not come to your area again until next week. I will confirm the day of that delivery by ' +
          wdm(D.confirmBy) + '.',
        'About the damaged cartons: a credit of this size has to be approved by our ' + F.managerRole + ', ' + F.manager +
          '. I sent her your photos and your request today, and I will let you know her decision.'
      ],
      sign: [F.staffFirst]
    },
    {
      n: 5,
      from: F.contact + ', ' + F.customer + ' <' + F.contactEmail + '>',
      to: F.staff + ' <' + F.staffEmail + '>',
      date: D.msg5,
      subject: 'Re: ' + subject + ' - still waiting',
      body: [
        F.staffFirst + ',',
        'You said you would confirm a delivery day by Friday. It is now Tuesday, I have heard nothing, and the ' + F.cupsMissing +
          ' missing cartons have still not arrived. For Saturday\'s job I had to buy cups at a cash-and-carry, for ' +
          money(F.localPurchase) + '. The receipt is attached.',
        'I am also still waiting for the credit you promised for the ' + F.cupsCrushed + ' damaged cartons. At your price of ' +
          money(F.cupPrice) + ' a carton, that is ' + money(F.creditDamaged) + '. With the ' + money(F.localPurchase) +
          ' I had to spend, I am asking for a credit of ' + money(F.creditAsked) + ' against invoice ' + F.invoiceNo + '.',
        'Please confirm this credit by Friday.'
      ],
      sign: [F.contactFirst]
    }
  ];

  function messageText(m) {
    return [
      'Message ' + m.n,
      'From: ' + m.from,
      'To: ' + m.to,
      'Date: ' + wdm(m.date),
      'Subject: ' + m.subject,
      '',
      m.body.join('\n\n'),
      '',
      m.sign.join('\n')
    ].join('\n');
  }

  var threadTitle = 'E-mail thread between ' + F.customer + ' and ' + F.supplier + ' (both invented)';
  var threadText = threadTitle + '\n\n' + thread.map(messageText).join('\n\n----------\n\n') + '\n';

  // ---------------------------------------------------------------------------
  // The returns and credits policy: one page of plain rules with numbers.
  // ---------------------------------------------------------------------------
  var policy = {
    title: F.supplier + ' (invented): returns and credits policy',
    intro: 'For customer service staff. Read this before you answer a complaint.',
    rules: [
      { n: 1, name: 'Damage', text: 'A customer must report damaged goods within ' + F.damageDays + ' working days of delivery, with photos of the goods and their packaging.' },
      { n: 2, name: 'Missing goods', text: 'A customer must report missing goods within ' + F.missingDays + ' working days of delivery. We send missing goods on our next delivery run to the customer\'s area, with no delivery charge.' },
      { n: 3, name: 'Who approves a credit', text: 'Anyone in customer service may approve a credit of up to ' + money(F.staffCreditLimit) + '. A credit above ' + money(F.staffCreditLimit) + ' must be approved by the ' + F.managerRole + '.' },
      { n: 4, name: 'How a credit is given', text: 'A credit is given as a credit note against the customer\'s invoice, within ' + F.creditNoteDays + ' working days of approval. We do not pay credits into a bank account or onto a card.' },
      { n: 5, name: 'Other costs', text: 'We do not pay for a customer\'s other costs, such as goods bought elsewhere, lost sales or staff time, unless the ' + F.managerRole + ' agrees in writing.' },
      { n: 6, name: 'Never promise by e-mail', text: 'Do not promise any of these in an e-mail: a credit, or its amount, before it has been approved; a delivery day the warehouse has not confirmed; payment of a customer\'s other costs.' },
      { n: 7, name: 'Replies', text: 'Answer every customer e-mail within ' + F.replyDays + ' working day, even if the answer is "we are still checking".' }
    ]
  };
  var policyText = policy.title + '\n' + policy.intro + '\n\n' +
    policy.rules.map(function (r) { return r.n + '. ' + r.name + '. ' + r.text.charAt(0).toUpperCase() + r.text.slice(1); }).join('\n') + '\n';

  // ---------------------------------------------------------------------------
  // The orders table: thirty rows, all invented. Two customers appear more than once.
  // ---------------------------------------------------------------------------
  var customers = [
    [F.customer, F.contact],
    ['Copperleaf Catering', 'Jonas Arvidsen'],
    ['Bramble Lane Cafe', 'Tessa Moreau'],
    ['North Quay Deli', 'Ravi Castellan'],
    ['Pinewick Coffee House', 'Elodie Brandt'],
    ['Saltmarsh Kitchen', 'Kwame Doherty'],
    ['The Larch Room', 'Ines Halloran'],
    ['Fennick\'s Pies', 'Bruno Fennick'],
    ['Ashgrove Tea Rooms', 'Leila Danforth'],
    ['Millrace Bagels', 'Tobias Ferreira'],
    ['Oak and Ember Grill', 'Sofia Lindqvist'],
    ['Kettle Yard Cafe', 'Daniel Achterberg'],
    ['Riverside Juice Bar', 'Hana Kowalczyk'],
    ['Juniper Hall Events', 'Marcus Ojala'],
    ['Little Orchard Nursery Cafe', 'Nadia Ferrante'],
    ['Greystone Canteen', 'Owen Takahara'],
    ['Blue Heron Bistro', 'Clara Holmgren'],
    ['Cobble Cross Bakehouse', 'Yusuf Haddad'],
    ['Sunday Market Crepes', 'Amelie Fournier'],
    ['Westbrook School Kitchen', 'Patrick Nwosu'],
    ['Thornfield Golf Club Cafe', 'Greta Albescu'],
    ['Harbour Light Fish Bar', 'Samir Qureshi'],
    ['Lantern Street Noodles', 'Mei Zhao'],
    ['Willowmere Care Home Kitchen', 'Fiona MacAskill'],
    ['Gable End Pizza', 'Luca Benedetti'],
    ['Quarry Hill Coffee Cart', 'Aisha Bello'],
    ['Brightwell Office Catering', 'Henrik Solberg']
  ].map(function (c, i) {
    return { business: c[0], contact: c[1], phone: '000-000-' + String(101 + i).padStart(4, '0'), email: emailFor(c[1]) };
  });

  // [day, month, customer index, amount, status]. Row 20 (index 19) is the case's order.
  var rowsRaw = [
    [3, 'February', 0, 640.5, 'Paid'],
    [3, 'February', 1, 1184, 'Paid'],
    [4, 'February', 2, 236.4, 'Paid'],
    [5, 'February', 3, 512.75, 'Paid'],
    [6, 'February', 4, 389, 'Paid'],
    [7, 'February', 5, 822.6, 'Paid'],
    [10, 'February', 6, 145.9, 'Paid'],
    [10, 'February', 7, 455, 'Paid'],
    [11, 'February', 8, 298.3, 'Paid'],
    [12, 'February', 9, 671.2, 'Paid'],
    [13, 'February', 10, 934, 'Invoiced'],
    [14, 'February', 11, 187.5, 'Paid'],
    [17, 'February', 12, 263.8, 'Invoiced'],
    [17, 'February', 0, 412, 'Paid'],
    [18, 'February', 13, 1348, 'Invoiced'],
    [19, 'February', 14, 156.25, 'Paid'],
    [20, 'February', 15, 703.4, 'Invoiced'],
    [21, 'February', 16, 342.1, 'Invoiced'],
    [21, 'February', 17, 498, 'Invoiced'],
    [D.placed.day, D.placed.month, 0, F.invoiceTotal, 'Part delivered'],
    [25, 'February', 18, 129.6, 'Invoiced'],
    [26, 'February', 1, 1962, 'Invoiced'],
    [27, 'February', 19, 1105.5, 'Delivered'],
    [28, 'February', 20, 274, 'Delivered'],
    [3, 'March', 21, 588.9, 'Delivered'],
    [4, 'March', 22, 317.45, 'Delivered'],
    [5, 'March', 23, 846, 'Open'],
    [6, 'March', 24, 402.3, 'Open'],
    [7, 'March', 25, 98.75, 'Open'],
    [10, 'March', 26, 1274, 'Open']
  ];
  var orderColumns = [
    { id: 'order', label: 'Order', personal: false, standIn: 'Order' },
    { id: 'date', label: 'Order date', personal: false, standIn: 'Date' },
    { id: 'business', label: 'Customer business', personal: true, standIn: 'Customer' },
    { id: 'contact', label: 'Contact person', personal: true, standIn: 'Contact' },
    { id: 'phone', label: 'Phone', personal: true, standIn: 'Phone' },
    { id: 'email', label: 'E-mail', personal: true, standIn: 'E-mail' },
    { id: 'amount', label: 'Amount', personal: false, standIn: 'Amount' },
    { id: 'status', label: 'Status', personal: false, standIn: 'Status' }
  ];
  var orderRows = rowsRaw.map(function (r, i) {
    var c = customers[r[2]];
    return {
      order: 'SO-' + (F.orderBase + i),
      date: shortDate({ day: r[0], month: r[1] }),
      business: c.business,
      contact: c.contact,
      phone: c.phone,
      email: c.email,
      amount: money(r[3]),
      status: r[4]
    };
  });
  // The choices that keep only what the exercise's question needs.
  var recommendedChoices = {
    order: 'keep', date: 'keep', business: 'standin', contact: 'leave', phone: 'leave', email: 'leave', amount: 'keep', status: 'keep'
  };
  var orders = {
    title: F.supplier + ' (invented): orders, ' + shortDate({ day: 3, month: 'February' }) + ' to ' + shortDate({ day: 10, month: 'March' }),
    note: 'Every business, person, phone number and e-mail address in this table is invented.',
    columns: orderColumns,
    rows: orderRows,
    recommendedChoices: recommendedChoices,
    question: 'Which customers have ordered more than once, and what is the total of each one\'s orders? Which orders are not yet paid?'
  };

  // ---------------------------------------------------------------------------
  // Eight snippets a person might paste into an assistant, and where each belongs.
  // ---------------------------------------------------------------------------
  var piles = [
    { id: 'fine', label: 'Fine to paste' },
    { id: 'remove', label: 'Paste after removing details' },
    { id: 'never', label: 'Do not paste' }
  ];
  var m3 = thread[2];
  var snippets = [
    {
      n: 1,
      title: 'Our price list, as published on our website',
      purpose: 'To ask for help writing a short offer for new customers.',
      text: F.supplier + ' price list\n' +
        F.cupSize + ' oz paper cups, carton of 1,000: ' + money(F.cupPrice) + '\n' +
        'Lids for 8 to 16 oz cups, carton of 1,000: ' + money(F.lidPrice) + '\n' +
        'Takeaway boxes, medium, carton of 250: ' + money(27.8),
      pile: 'fine',
      reason: 'It is already public: anyone can read it on the website. Nothing in it is about a person, and nothing is secret.'
    },
    {
      n: 2,
      title: 'A paragraph for our website\'s news page, not yet published',
      purpose: 'To ask for a clearer version.',
      text: 'From April, every carton we send will be made from recycled board. Customers can give empty cartons back to our drivers, and we will use them again.',
      pile: 'fine',
      reason: 'It is your own text, written to be published. It names no one and holds nothing confidential.'
    },
    {
      n: 3,
      title: 'A customer\'s complaint, with her name, e-mail address and order number',
      purpose: 'To ask for help with the wording of a reply.',
      text: 'From: ' + m3.from + '\nSubject: ' + m3.subject + '\n\n' + m3.body[1] + ' ' + m3.body[2],
      pile: 'remove',
      accept: ['remove', 'never'],
      reason: 'Two piles are defensible. The wording of a reply does not depend on who she is: replace her name, her e-mail address and the business with stand-ins such as [CUSTOMER], then put the real ones back in your reply. The order number means nothing outside your own company\'s systems, so it may stay, as it does in part 2. What would tip it to "do not paste": an employer\'s policy that keeps all customer correspondence out of public tools, or a complaint whose content would still point to her, or hold something sensitive, once her name is gone.'
    },
    {
      n: 4,
      title: 'The orders table: thirty rows with business names, contact people, phones and e-mails',
      purpose: 'To ask which customers ordered most this quarter.',
      text: 'Order | Order date | Customer business | Contact person | Phone | E-mail | Amount | Status\n' +
        [0, 1].map(function (i) {
          var r = orderRows[i];
          return [r.order, r.date, r.business, r.contact, r.phone, r.email, r.amount, r.status].join(' | ');
        }).join('\n') + '\n(' + (orderRows.length - 2) + ' more rows)',
      pile: 'remove',
      accept: ['remove', 'never'],
      reason: 'Two piles are defensible. The question needs the amounts and a way to tell customers apart, not their names, phones or e-mails. Leave those columns out, replace each business with a stand-in such as Customer 01, and map the answer back on your own computer: part 2 of this exercise does exactly that. What would tip it to "do not paste": an employer\'s policy that keeps all customer data out of public tools, whatever is removed.'
    },
    {
      n: 5,
      title: 'The warehouse rota for next week, with staff names (invented)',
      purpose: 'To ask for a fairer pattern of early shifts.',
      text: 'Week of 10 March\nSam Ridley: Monday to Wednesday, 06:00 to 14:00\nOla Petrova: Monday to Friday, 14:00 to 22:00\nJakub Novak: Thursday to Saturday, 06:00 to 14:00 (back after sick leave, no lifting)',
      pile: 'remove',
      accept: ['remove', 'never'],
      reason: 'Two piles are defensible. The pattern of shifts can be planned with Staff A, Staff B and Staff C, once the names are out and the note about sick leave is out too: it is health information about a person, and it does not change the question. What would tip it to "do not paste": in a team this small, the pattern itself can still point to the one person who has just come back from sick leave.'
    },
    {
      n: 6,
      title: 'A note from an employee\'s doctor (invented)',
      purpose: 'To ask for help planning his duties while he recovers.',
      text: 'Fit note: Jakub Novak, warehouse. Lower back strain. Not fit for lifting over 10 kg until 31 March. Review in 3 weeks.',
      pile: 'never',
      reason: 'It is health information about a person. In a team of a dozen people, taking out the name does not hide who it is. Ask in general words instead: "How can a small warehouse plan duties for someone who cannot lift for a few weeks?"'
    },
    {
      n: 7,
      title: 'Our customer contact list: every contact name with a mobile number',
      purpose: 'To ask for help putting it into one tidy format for a new phone system.',
      text: customers.slice(1, 4).map(function (c) { return c.contact + ', ' + c.business + ', ' + c.phone; }).join('\n') + '\n(' + (customers.length - 3) + ' more rows)',
      pile: 'never',
      reason: 'The list is nothing but personal details: take them out and nothing is left to work on. To learn how to tidy such a list, paste two rows you have made up, then do the real list yourself.'
    },
    {
      n: 8,
      title: 'The terms of a signed supply contract with an events customer (invented)',
      purpose: 'To ask what a penalty clause means for us.',
      text: 'Supply agreement with Juniper Hall Events. Prices fixed for 12 months. An 8% discount in any month above $5,000.00. A penalty of $250.00 for each late delivery. Both parties keep these terms confidential.',
      pile: 'never',
      reason: 'They are terms you have signed to keep confidential, and the contract says so. Ask the question in general words instead: "What does a penalty clause for late delivery usually mean for a supplier?"'
    }
  ];
  // The piles the key accepts: one, or two where both are defensible (the reason then says what tips it).
  snippets.forEach(function (s) { s.accept = s.accept || [s.pile]; });

  // ---------------------------------------------------------------------------
  // The prepared requests (briefs). Exercise 2 uses the summary brief. The reply
  // brief is the model answer to exercise 1 and the request behind exercise 3.
  // A part may name material instead of text: 'thread', 'policy'.
  // ---------------------------------------------------------------------------
  var briefs = {
    wish: {
      line: 'Write a reply to this customer.',
      material: ['thread']
    },
    summary: {
      situation: 'I work at ' + F.supplier + '. Our ' + F.managerRole + ', ' + F.manager + ', has to decide today on a customer\'s request for a credit. She has not read the e-mails and has two minutes to read a summary.',
      material: ['thread'],
      task: 'Summarise the e-mail thread above for ' + F.manager.split(' ')[0] + '.',
      // The last sentence of the form is the line that makes the answer checkable. In exercise 2 the
      // participant writes it; the recorded answer was made with this exact line in the request.
      citeLine: 'After each fact, put the number of the message it comes from in brackets, like this: (msg 2).',
      form: 'At most 120 words, as short bullet points. Include the order number, the invoice number, what went wrong, the amount in question, and what we did and did not promise. After each fact, put the number of the message it comes from in brackets, like this: (msg 2).',
      limits: 'Use only the e-mails. Do not guess, and do not work out figures that are not in them. Where the customer says something we have not checked, write "' + F.contactFirst + ' says". If something is not in the e-mails, write "not stated".'
    },
    reply: {
      situation: 'I work in customer service at ' + F.supplier + ', a supplier of cups, lids and packaging to cafes and bakeries. ' + F.contact + ' owns ' + F.customer + ', one of our customers. Her order came late, short and partly damaged, and she has written to us three times. She is right that we let her down: we did not confirm a delivery day by Friday, as we said we would. I need to answer her last message today.',
      material: ['thread', 'policy'],
      task: 'Draft my reply to ' + F.contactFirst + '\'s last message (message 5).',
      form: 'An e-mail of at most 150 words, in three short paragraphs: first, an apology for not confirming a delivery day; second, where things stand on the missing cartons and on the credit she asks for; third, what happens next and when she will hear from me. Plain and warm, with no stock phrases. Sign it ' + F.staff + '.',
      limits: 'Do not promise a credit or any amount: a credit above the limit in the policy needs the ' + F.managerRole + '\'s approval. Do not promise a delivery day: the warehouse has not confirmed one. Do not offer to pay for the cups she bought elsewhere. Do not offer anything the policy does not allow, such as a discount. Use only facts from the e-mails and the policy; if something is not there, say we will find out.'
    }
  };

  // ---------------------------------------------------------------------------
  // Exercise 2: the facts a manager's summary must hold, and how the checker
  // recognises each one. Each sign is stated in plain words on the page.
  // ---------------------------------------------------------------------------
  var summaryFacts = [
    { id: 'order', name: 'the order number', numbers: [[F.orderBase + F.orderRow]], where: 'message 1, and every subject line' },
    { id: 'invoice', name: 'the invoice number', numbers: [[Number(F.invoiceNo.replace(/\D/g, ''))]], where: 'message 3' },
    { id: 'amount', name: 'the amount in question', numbers: [[F.creditAsked], [F.creditDamaged, F.localPurchase]], where: 'message 5' }
  ];

  // ---------------------------------------------------------------------------
  // The ten-question check: two questions for each objective.
  // ---------------------------------------------------------------------------
  var quiz = [
    {
      n: 1, objective: 'O1',
      text: 'A colleague writes: "I own a small bakery. Our packaging supplier delivered our order late and partly damaged, and I want the damaged cartons replaced before the weekend. The whole e-mail thread with them is pasted below. Draft my reply to their last message, in at most 100 words and two short paragraphs." Which part of a five-part brief is missing?',
      options: [
        { text: 'The situation', why: 'It is there: who is writing, to whom, what happened, and what she wants.' },
        { text: 'The material', why: 'It is there: the whole e-mail thread is pasted below the request.' },
        { text: 'The form', why: 'It is there: "at most 100 words and two short paragraphs" names a length and a structure.' },
        { text: 'The limits', correct: true, why: 'Nothing says what the reply must not do: for example, not to accept a credit instead of a replacement, or not to threaten to change supplier. Without limits, the assistant decides those things for you.' }
      ]
    },
    {
      n: 2, objective: 'O1',
      text: 'In exercise 1, the reply to the one-line request promised the customer a corrected invoice that nobody had decided on. Which line in a brief would most likely have prevented that?',
      options: [
        { text: '"Be professional, and keep a calm and friendly tone."', why: 'A promise can be perfectly professional and friendly. This line says nothing about what may be promised.' },
        { text: '"Do not promise anything the e-mails and the policy do not."', correct: true, why: 'It names what not to do, and where the boundary comes from, so the assistant can word the reply around it.' },
        { text: '"Keep it under 150 words, in three short paragraphs."', why: 'A short reply can still promise a corrected invoice. Length and limits are different parts of the brief.' },
        { text: '"Use the e-mails below, and reply only to her very last message."', why: 'That is the material and the task. The request behind the recorded reply had the e-mails and a task, and the reply still made the promise.' }
      ]
    },
    {
      n: 3, objective: 'O2',
      text: 'An assistant\'s summary says: "The customer asks for a credit of ' + money(F.creditAsked + 9) + '." You cannot find that figure anywhere in the thread. What do you do first?',
      options: [
        { text: 'Find the figures the credit is made of, and add them yourself.', correct: true, why: 'The thread is the authority. If the parts are there, you can rebuild the total and see whether it is right: here it is not.' },
        { text: 'Keep it: assistants add up well, and the sum looks about right.', why: 'Assistants can and do get sums wrong, or add figures that were never meant to be added. A figure you cannot find is a figure you have not checked.' },
        { text: 'Delete the whole summary and write a new one from the start.', why: 'One wrong figure does not make the rest worthless. Check and fix it, and keep what is right.' },
        { text: 'Ask the assistant whether it is sure, and keep it if it says yes.', why: 'It will often say yes, or give you a different number with the same confidence. Only the material can settle it.' }
      ]
    },
    {
      n: 4, objective: 'O2',
      text: 'Which line in a request makes the answer quickest to check?',
      options: [
        { text: '"Be accurate, and check each figure carefully."', why: 'Every assistant already tries to be. This line gives you nothing to check with.' },
        { text: '"Double-check your work before you answer."', why: 'It may change the wording, but you still cannot see where any figure came from.' },
        { text: '"After each fact, name the message it is from."', correct: true, why: 'Now each figure points to the place to look. Checking takes seconds per fact, and a fact with no source stands out.' },
        { text: '"Use short bullet points, most important first."', why: 'Bullet points are easier to read, not easier to check. You would still have to search the thread for every figure.' }
      ]
    },
    {
      n: 5, objective: 'O3',
      text: 'The thread says ' + F.cupsMissing + ' cartons were missing and ' + F.cupsCrushed + ' arrived crushed. A summary says: "' + F.cupsCrushed + ' cartons were missing or damaged." What is wrong?',
      options: [
        { text: 'It merges two groups: ' + (F.cupsMissing + F.cupsCrushed) + ' cartons were affected, not ' + F.cupsCrushed + '.', correct: true, why: 'The same number appears twice with two meanings. Merging them halves the problem the manager has to decide on.' },
        { text: 'Nothing: ' + F.cupsCrushed + ' is in the thread, so the figure must be right.', why: 'A figure can be in the thread and still be used wrongly. Here it counts two different groups of cartons.' },
        { text: 'The figure should be written out in words.', why: 'How a number is written does not make it right or wrong. What it counts does.' },
        { text: 'It breaks a rule of the returns policy.', why: 'A summary for your own manager breaks no rule of the policy. The problem is the figure, not a rule.' }
      ]
    },
    {
      n: 6, objective: 'O3',
      text: 'A drafted reply says: "I can confirm that we will cover the ' + money(F.localPurchase) + ' you spent at the cash-and-carry." Every figure in it is correct. Why could it still be wrong?',
      options: [
        { text: 'It is too short to explain the decision.', why: 'Length is not the problem. One short sentence can commit the company to a cost.' },
        { text: 'The amount should be rounded to a whole number.', why: 'Rounding would make the figure less exact, and the promise would still break the policy.' },
        { text: 'Nothing: the customer asked for exactly that.', why: 'What a customer asks for and what you may promise are different things. The reply must follow the policy.' },
        { text: 'It promises a payment the policy rules out.', correct: true, why: 'Paying a customer\'s other costs needs the ' + F.managerRole + '\'s agreement in writing (policy, rules 5 and 6). Correct figures do not make a promise allowed.' }
      ]
    },
    {
      n: 7, objective: 'O4',
      text: 'You want help writing a kind message to an employee who is coming back after an injury. What is the safest way to ask a public assistant?',
      options: [
        { text: 'Paste the doctor\'s note, so it has every detail.', why: 'Health information about a person should not go into a public assistant, and the message does not need it.' },
        { text: 'Paste the note, but with the employee\'s name taken out first.', why: 'In a small team, everyone knows who has been off injured. Taking out the name does not hide who it is.' },
        { text: 'Ask in general words, with no name or health details.', correct: true, why: 'You get the help with the wording, and nothing about the person leaves your computer. Add the personal part yourself.' },
        { text: 'Do not use an assistant for anything about staff.', why: 'That is stricter than it needs to be. You can get good help without giving any personal facts.' }
      ]
    },
    {
      n: 8, objective: 'O4',
      text: 'Your manager asks which customers ordered most this quarter. You prepare the orders table for an assistant. What do you keep?',
      options: [
        { text: 'Every column: it will ignore what it does not need.', why: 'It may ignore it, but it has still received it. What you do not paste cannot leak.' },
        { text: 'The amounts, the dates and a stand-in for each customer.', correct: true, why: 'That is everything the question needs. The key to the stand-ins stays on your own computer, and you map the answer back yourself. Your employer\'s own policy comes first: if it says no customer data at all, follow it.' },
        { text: 'The names and phone numbers, so it can tell customers apart.', why: 'Those are the personal details, and the question does not need them: a stand-in tells customers apart just as well.' },
        { text: 'Nothing: this question can never be asked safely.', why: 'It can, once the table holds nothing personal. The stand-ins make that possible.' }
      ]
    },
    {
      n: 9, objective: 'O5',
      text: 'A colleague\'s template begins: "Summarise the thread below for ' + F.manager + ' about order ' + F.orderNo + ', in at most 120 words." What should change before others reuse it?',
      options: [
        { text: 'Nothing: it worked well the first time.', why: 'It worked once, for one case. The next person would send the wrong name and the wrong order number.' },
        { text: 'Take out the word limit, to suit longer threads.', why: 'The word limit is part of the form, and it is the same every time. Keep it.' },
        { text: 'Put named placeholders for the person and order.', correct: true, why: 'A named placeholder, such as [MANAGER] or [ORDER NUMBER], tells the next person exactly what to put there, and a check can find any that were left unfilled.' },
        { text: 'Make it longer, so that it covers more kinds of case.', why: 'Longer is not more reusable. What makes it reusable is taking the case\'s values out.' }
      ]
    },
    {
      n: 10, objective: 'O5',
      text: 'Someone used a template for a new customer, and the summary they got back mentions a customer from an old case. What most likely happened?',
      options: [
        { text: 'The assistant invented a customer from nowhere.', why: 'Possible, but the more likely cause is in the request itself. Check the template first.' },
        { text: 'The template had too many placeholders in it.', why: 'Placeholders cannot add a name: they are the places where a name is meant to go.' },
        { text: 'The new e-mails were too long for the assistant to read.', why: 'Long material can cause other problems, but it would not bring in a customer from an old case.' },
        { text: 'A value from the old case was left in the template.', correct: true, why: 'A name or a number left in a template goes out with every use. That is why the template check looks for values of the old case.' }
      ]
    }
  ];
  // The letters follow the order the options are written in.
  quiz.forEach(function (q) { q.options.forEach(function (o, i) { o.key = 'ABCD'.charAt(i); }); });

  var data = {
    facts: F,
    format: { money: money, dm: dm, wdm: wdm, shortDate: shortDate },
    thread: thread,
    threadTitle: threadTitle,
    threadText: threadText,
    messageText: messageText,
    policy: policy,
    policyText: policyText,
    orders: orders,
    customers: customers,
    piles: piles,
    snippets: snippets,
    briefs: briefs,
    summaryFacts: summaryFacts,
    quiz: quiz
  };

  root.WorkshopCase = data;
  if (typeof module === 'object' && module.exports) { module.exports = data; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
