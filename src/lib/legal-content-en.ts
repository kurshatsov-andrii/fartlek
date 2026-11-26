/** Trusted, static English translations of the published Ukrainian legal documents. */
const site = '<a href="https://fartlek.com.ua/" class="text-primary hover:underline">https://fartlek.com.ua/</a>';
const email = '<a href="mailto:info@fartlek.com.ua" class="text-primary hover:underline">info@fartlek.com.ua</a>';
const phone = '<a href="tel:+380972520551" class="text-primary hover:underline">+38 097 252 05 51</a>';

function documentHtml(text: string): string {
  let listOpen = false;
  const result: string[] = [];
  for (const line of text.trim().split('\n').filter(Boolean)) {
    const item = line.startsWith('- ');
    if (listOpen && !item) { result.push('</ul>'); listOpen = false; }
    if (item) {
      if (!listOpen) { result.push('<ul class="list-disc pl-6 mb-3 space-y-2 text-foreground/90">'); listOpen = true; }
      result.push(`<li>${line.slice(2)}</li>`);
    } else if (line.startsWith('## ')) {
      result.push(`<h2 class="text-xl font-bold mt-8 mb-4 text-foreground">${line.slice(3)}</h2>`);
    } else if (line.startsWith('# ')) {
      result.push(`<h1 class="text-3xl font-bold mt-4 mb-6 text-foreground">${line.slice(2)}</h1>`);
    } else {
      result.push(`<p class="mb-3 leading-relaxed text-foreground/90">${line}</p>`);
    }
  }
  if (listOpen) result.push('</ul>');
  return result.join('\n');
}

export const PRIVACY_EN = documentHtml(`
# Privacy Policy
<strong>PRIVACY AND PERSONAL DATA PROTECTION POLICY</strong>
This Privacy and Personal Data Protection Policy (the Policy) is an integral part of the User Agreement for ${site}.
When using the Website, Visitors/Users must comply with the applicable laws of Ukraine and the Website's terms of use.
If the Website Administration discovers that a Visitor/User has violated the law or the terms of use while using the Website, it may suspend or completely terminate that Visitor's/User's access to the Website.
The Website may contain links to other websites for information purposes only. This Policy does not apply to those websites when you follow such links.
For questions about the Privacy and Personal Data Protection Policy, please contact ${email}.
## Privacy of Visitor/User activity on the Website
Information about Visitors'/Users' activity on the Website is protected in accordance with the law. The Website Administration does not in any way violate the confidentiality of a Visitor's/User's activity when they use the Website's services.
## Personal data protection
Visitors/Users agree that, by completing the Registration Form, they consent to ${site} receiving and including the personal data they provide in a personal data database, processing that data and, where necessary, transferring it to third parties exclusively in cases provided for by the applicable laws of Ukraine.
Upon registration, the Visitor/User also consents to the use and transfer to third parties of their images and photographs, audio and video material recorded during the event.
When registering a child and/or a minor for an event, the person completing the Registration Form guarantees that they are the child's and/or minor's legal representative (in particular, a parent, adoptive parent, guardian and/or other legal representative) and consents to the use, processing and transfer to third parties for further marketing use of that person's personal information, personal data and photographs, video or audio material featuring them, without any compensation from the organizers and/or third parties and without prior approval from that legal representative.
The Website Administration collects only personal data (such as first name, last name, login and password, email address, contact telephone number, date of birth, gender, etc.) that the Visitor/User, as a personal data subject, knowingly and voluntarily provides to use the Website's services. In accordance with the law, this constitutes the data subject's consent to the processing of their personal data for the purposes specified in this Policy.
The Website Administration does not collect information subject to special statutory processing requirements (information about racial or ethnic origin, political, religious or philosophical beliefs, membership of political parties or trade unions, criminal convictions, etc.), or information concerning health, sex life, biometric or genetic data.
## Purposes of using personal data
Personal data is used to provide access to the Website's services and to exchange information/news.
## Personal data retention period
Personal data is retained for no longer than necessary for the purposes of its processing.
Once a data subject ceases to be a Website User by deleting their Website account, their personal data is also automatically deleted.
## Conditions of access to personal data
Third-party access to personal data is governed by the terms of the User's consent given to the personal data controller for processing that data, or by the requirements of applicable law.
A User has the right to obtain information about themselves from any party involved in personal data relations, provided they state their surname, first name and patronymic, place of residence (or stay), and details of the identity document of the individual making the request, except in cases established by applicable law.
Users may access their own data free of charge.
## Rights of the personal data subject
A personal data subject has the right to:
- know the sources of collection and location of their personal data, the purpose of its processing, and the location or place of residence (or stay) of the personal data controller or processor, or authorize other persons to obtain this information, except in cases established by law;
- receive information about the conditions of access to personal data, including information about third parties to whom their personal data is transferred;
- access their personal data;
- receive, no later than thirty calendar days after receipt of a request, except in cases provided for by law, a response as to whether their personal data is being processed and obtain the contents of that personal data;
- submit a reasoned objection to the personal data controller concerning the processing of their personal data;
- submit a reasoned request to any personal data controller or processor to amend or destroy personal data that is processed unlawfully or is inaccurate;
- protection of their personal data against unlawful processing and accidental loss, destruction or damage resulting from deliberate concealment, failure to provide or delayed provision of data, and protection against the provision of inaccurate information or information that discredits an individual's honour, dignity or business reputation;
- use legal remedies where personal data protection laws are violated;
- make reservations restricting the right to process their personal data when giving consent;
- withdraw consent to personal data processing.
## Personal data protection
The Website Administration uses generally accepted standards of technological and operational protection of information and personal data against loss, misuse, alteration or destruction.
The Website Administration ensures compliance with all relevant confidentiality obligations and implements technical and organizational security measures to prevent unauthorized or unlawful disclosure or processing of such information and data, as well as accidental loss, destruction or damage.
Only authorized employees who have agreed to maintain the confidentiality of such information and data have access to confidential information and personal data.
Disclosure of personal data without the consent of the data subject or their authorized representative is permitted in cases defined by law and only, where necessary, in the interests of national security, economic well-being and human rights.
## Cookies
Cookies are text files stored in your web browser that help distinguish a User's browser from the browsers of other Visitors.
Cookies are used to identify and track the actions of any Website User. Information obtained about a User is stored on the server as the User's personal data.
## Changes to the Privacy and Personal Data Protection Policy
The Website Administration reserves the right to amend this Policy if the method, procedure or purpose of collecting, processing, using or storing personal data changes.
## Administration details
Sole proprietor Kurshatsov A. I.
EDRPOU — 2820213458
24 Vlasenka Street, Kharkiv
${email}
`);

export const USER_AGREEMENT_EN = documentHtml(`
# User Agreement
<strong>AGREEMENT for using ${site}</strong>
## Definitions
Website — ${site}.
Website Visitor — any individual who has visited and viewed at least one page of the Website without prior registration and authentication on the Website.
Website User — a Visitor who has registered and signed in using unique individual credentials.
## 1. Subject of the Agreement
1.1. This Agreement is entered into between the Administration of ${site} and the Website Visitor/User and describes the conditions of using the Website.
1.2. The Administration may amend this Agreement without prior notice to the Visitor/User. A new version takes effect when posted on the Website, unless that version provides otherwise. The Visitor/User is responsible for reviewing new versions of the Agreement.
1.3. Additional conditions may be established on the Website for the use of individual resources and services.
1.4. A Visitor's/User's disagreement with this Agreement does not relieve them of the obligation to follow the basic rules when using the Website.
## 2. Website use. Registration
2.1. Any Visitor has the right to register on the Website.
2.2. Registration is not mandatory. Unregistered Visitors have access only to Website materials.
2.3. To register, a Visitor must provide complete and truthful information about themselves in the registration form.
2.4. The User voluntarily provides their email address, first and last name and other details.
2.5. The User is responsible for the accuracy of the information provided in the registration form.
2.6. The User is responsible for actions performed using their login/password.
2.7. Neither the User nor the Website Administration discloses the User's password.
2.8. The User's personal data is protected by the laws of Ukraine.
2.9. Only Users who have confirmed their email address may comment on Website materials.
2.10. The Website Administration may restrict User rights, up to revoking Website registration, where this Agreement is violated.
2.11. It is prohibited to post or distribute on the Website:
- calls for violent change or overthrow of the constitutional order or seizure of state power; calls to change Ukraine's territorial boundaries or state border in violation of the procedure established by the Constitution of Ukraine; calls for arson, destruction of property, seizure of buildings and structures or violent eviction of citizens; calls for aggression or incitement of armed conflict; or other material that may constitute a criminal offence or cause one to be committed;
- material that is unlawful or harmful, offends morality, honour and dignity, or infringes third parties' rights and legally protected interests, as well as obscene language and pornographic, erotic or sexual material or statements;
- advertising, commercial or adaptation-related material whose placement has not been agreed with the Administration;
- copyrighted intellectual property without the appropriate permission for public posting or distribution;
- material containing computer code intended to disrupt, destroy or restrict the functionality of computer or telecommunications equipment or software or gain unauthorized access, as well as serial numbers for commercial software products, logins, passwords and other means of obtaining unauthorized access to paid Internet resources;
- other users' personal data;
- material whose content and/or distribution violates the applicable laws of Ukraine or provisions of international law;
- information of a commercial nature.
2.12. The User confirms that they are personally responsible for any information they provide or post on the Website.
## 3. The Visitor/User has the right to:
3.1. Use information posted on the Website only to disseminate information about the Website.
3.2. Obtain information about the event calendar.
3.3. Protection of their rights under the Law of Ukraine “On Personal Data Protection”.
3.4. Supplement, amend or delete publications/information made through ${site} at any time.
3.5. Create their own text messages and comments relating to information posted on the Website.
3.6. The User grants the Website Administration permission to process the information they provide, which also includes its use.
3.7. Contact the Website Administration to resolve disputes.
## 4. The Visitor/User undertakes to:
4.1. Take appropriate measures to keep their personal login and password for Website access secure.
4.2. Regularly review this Agreement to become aware of amendments in a timely manner.
4.3. Accept full responsibility for actions performed using their account and any consequences such use may cause or has caused.
4.4. When using Website information, acknowledge and accept risks associated with its possible inaccuracy and the possibility that some information may seem threatening, offensive, defamatory, knowingly false, rude or indecent. If this happens, the Visitor/User must immediately notify the Website Administration.
4.5. Read the Privacy and Personal Data Protection Policy. By registering on the Website, the User confirms their agreement with that Policy.
4.6. Not register, impersonate another person or publish information through the Website on behalf of another individual, legal entity, trademark, etc.
4.7. Not use another person's contact information (telephone number, email address, etc.) on the Website where the User has no right to use it.
4.8. Not post or publish knowingly inaccurate or false information.
4.9. Not use the Website or its information for any other purposes, including advertising mailings, dissemination of false information, commercial activity or unlawful activity that violates Ukrainian or international law.
4.10. Not publish or transmit through the Website information, whether text, graphics or in another form, that the User has no right to use, including information protected by copyright or confidentiality agreements.
4.11. The User understands and agrees that they transfer to the Administration, free of charge, exclusive intellectual property rights in intellectual property that they post on the Website free of charge, including works, articles, photographs, videos, graphics, etc.
4.12. Notify the Website Administration as soon as possible upon discovering unauthorized use of Website resources.
## 5. The Visitor/User is responsible:
5.1. For all information published by the User through ${site}.
5.2. For all activity on the Website.
5.3. The User acknowledges all risks of publishing information through ${site} and is responsible for all possible consequences of such publication.
## 6. The Administration undertakes to:
6.1. Allow Visitors/Users to use the Website in accordance with this Agreement.
## 7. The Administration has the right to:
7.1. Change the Website's design, content and list of services at any time, and modify or supplement scripts, software and other objects used or stored on the Website.
7.2. Send Users email messages concerning Website use when necessary.
7.3. Suspend, restrict or terminate Visitors'/Users' access to all or any Website sections or services without prior notice.
7.4. Use Users' email addresses to send messages.
7.5. Delete User messages and comments that contradict this Agreement or the applicable laws of Ukraine.
7.6. Use copyrighted material provided by the User on the Website, including but not limited to works, articles, photographs, videos and graphics, free of charge.
7.7. Block a User account if this Agreement is violated.
7.8. Delete any content without explaining the reasons where it violates applicable Ukrainian law, the Agreement and/or other Website rules.
7.9. Close any resource or service at any time without prior notice to the Visitor/User. In such cases, the Administration is not liable for termination of access to its Website resources.
## 8. The Administration is not liable:
8.1. To Visitors/Users or third parties for direct, indirect or unintentional damage, including lost profits or data, or damage to honour, dignity or business reputation arising in connection with Website use or intellectual works posted on the Website.
8.2. For Visitors'/Users' actions on the Website.
8.3. For the content, lawfulness or accuracy of information used or obtained by a User on the Website.
8.4. For the consequences of using information used or obtained by a Visitor/User on the Website.
8.5. Registration or any use of the Website does not imply any relationship between the Administration and a Visitor/User. The Visitor/User is personally responsible for all activity.
8.6. If third parties bring claims against the Administration in connection with information posted by a User, including claims by copyright and/or related-rights holders, their authorized representatives or third parties, the User must independently and at their own expense settle and resolve all disputes and fully reimburse the Administration for losses incurred.
## 9. Final provisions
9.1. Reproduction of Website information materials in print, electronic or other form is permitted only with the Administration's permission.
9.2. This Agreement applies to all Website Visitors/Users and all methods of Website use, including publication, viewing and any use of information posted on or transmitted through the Website.
`);

export const PUBLIC_OFFER_EN = documentHtml(`
# Public Offer Agreement
Please read this offer. If you disagree with or do not understand any provision, we suggest that you decline the services or clarify the information by calling ${phone} or emailing ${email}. By accepting this public offer, you agree to all its terms and confirm that you understand all its provisions.
## Proposal (public offer)
The Agreement below is addressed to individuals and constitutes the official public offer, pursuant to Article 641 of the Civil Code of Ukraine, of <strong>sole proprietor Kurshatsov A. I.</strong>, hereinafter the “Provider”, on the terms set out in the Agreement and according to the selected services listed on the Provider's Website: ${site}.
The Agreement is deemed concluded under Article 642 of the Civil Code of Ukraine and takes effect as a contract of adhesion when you perform the actions specified in clause 4.5, signifying your full and unconditional acceptance of all its terms without exceptions and/or restrictions (acceptance).
## 1. General provisions
1.1. Each Party guarantees to the other that it has the necessary legal capacity and all rights and authority necessary and sufficient to enter into and perform the Agreement in accordance with its terms.
1.2. The current version of this Agreement is always posted on the Provider's Website and must be available for the Client to review before accepting its terms.
## 2. Definitions used in this Agreement
2.1. “Client” — an individual aged 18 or over with full civil legal capacity who purchases competition organization services from the Provider.
2.2. “Provider's Website” — the collection of web pages available on the Internet under the domain ${site}.
2.3. The Client and Provider are also referred to collectively as the “Parties” and individually as a “Party”.
## 3. Subject of the Agreement
3.1. The subject of this Agreement is the Provider's provision of services to the Client, both physical and intangible (for example, registration certificates for participation in sports events), according to the selected services listed on the Provider's Website and on the terms set out in this Agreement.
## 4. Procedure for concluding the Agreement
4.1. The Agreement is concluded between the Client and Provider as a contract of adhesion under Article 634 of the Civil Code of Ukraine.
4.2. Acceptance means the Client's full and unconditional acceptance of all terms without exceptions and/or restrictions and is equivalent to entering into a bilateral written agreement.
4.3. Acceptance consists of the Client performing the actions specified in clause 4.4.
4.4. After reviewing the terms on the Provider's Website, the Client accepts the Agreement by performing any of the following actions, together or separately:
- completing the specialized Application form on the Provider's Website;
- paying for the Provider's services at the price shown on the Provider's Website.
4.5. Any individual action specified in clause 4.4 performed by the Client demonstrates that the Client has read this Agreement and agrees to all its terms.
4.6. The acceptance period is unlimited.
4.7. Payment for a service confirms the final decision to purchase it.
4.8. The Agreement is deemed concluded and takes effect upon acceptance and remains effective until the Client receives the service or it is terminated on grounds set out in the Agreement and/or applicable Ukrainian law. After the service is received, relations between the Client and Seller are governed by applicable Ukrainian law.
4.9. By concluding the Agreement, the Client:
- has reviewed the rules for receiving services to the extent necessary for them;
- recognizes the Provider's unconditional professional competence and the rules for carrying out all actions described in this Agreement;
- accepts all terms of this Agreement without reservations.
## 5. Payment procedure
5.1. Services are provided exclusively on a prepaid basis, with the Client paying for selected items at the prices shown on the Provider's Website.
5.2. Payment made for a service is non-refundable if the Client unilaterally terminates the Agreement or violates its terms.
5.3. Payment for goods is made by transferring funds to the Provider's bank card through LiqPay / WayForPay.
## 6. Provider's rights and obligations
<strong>6.1. The Provider must:</strong>
- 6.1.1. Make this Agreement available for the Client to review before providing services by publishing it on the Provider's Website;
- 6.1.2. Ensure quality provision of services to the Client or their authorized representative;
- 6.1.3. Provide recommendations when selecting types of services where requested by the Client;
- 6.1.4. Notify the Client of changes to service conditions and sports competition regulations when registration slots for those competitions are purchased. The Provider is not liable for delayed notification if the Client supplied outdated contact details.
<strong>6.2. The Provider has the right to:</strong>
- 6.2.1. Limit the number of registration certificates for sports events;
- 6.2.2. Refuse to sell registration certificates to persons who do not meet age or other participant criteria, or who violate or have previously violated event principles;
- 6.2.3. Unilaterally amend this Agreement, including service prices.
## 7. Client's rights and obligations
<strong>7.1. The Client must:</strong>
- 7.1.1. Provide accurate registration details for sports event registration certificates.
- 7.1.2. Follow the Provider's recommendations and advice in good faith when using the services.
<strong>7.2. The Client has the right to:</strong>
- 7.2.1. Use services in accordance with this Agreement;
- 7.2.2. Require the Provider to comply with this Agreement;
- 7.2.3. Choose additional services offered by the Provider;
- 7.2.4. Review sports event regulations and conditions;
- 7.2.5. Suggest improvements to the Provider's work;
- 7.2.6. Participate in the Provider's events.
## 8. Liability of the Parties
8.1. The Provider is liable to the Client up to the documented amount of Payment/Prepayment for services not received.
8.2. The Provider is not liable for Client losses arising from the Client's refusal to receive services in accordance with this Agreement.
8.3. The Provider is liable only for obligations specified in the Agreement and applicable Ukrainian law.
8.4. The Client is fully responsible for the accuracy of information supplied in the Client Application and when completing an insurance form. If the Client fails to provide or incorrectly provides personal data, the Provider is not liable for losses caused by refusal to refund prepayment or provide services and/or other actions resulting from the inability to identify the Client correctly.
8.5. In other cases of non-performance or improper performance of obligations, the Parties are liable under Ukrainian law, taking into account the terms of this Agreement.
8.6. The Parties are released from liability for total or partial non-performance if caused by force majeure circumstances arising after this Agreement takes effect, resulting from extraordinary events that could not be foreseen or prevented by reasonable measures.
8.7. If the Client violates this Agreement, the Provider is not liable for the obligations specified in the Agreement.
## 9. Amendments and termination
9.1. The Provider may unilaterally amend the Agreement by publishing changes on the Provider's Website. Changes take effect upon publication unless another effective date is specified when they are published.
9.2. When making material amendments that affect the Client's ability to use goods, the Provider notifies the Client by publishing them on the Website at least one day before they take effect.
9.3. The Agreement may be terminated:
- 9.3.1. If the Client decides not to receive services and notifies the Provider by written application.
- 9.3.2. On other grounds provided for by this Agreement and/or applicable Ukrainian law.
## 10. Dispute resolution
10.1. All disputes and disagreements arising or potentially arising from improper performance of this Agreement are to be resolved through negotiations based on one Party's written request to the other.
10.2. After receiving a Client claim, the Provider must review it within 5 (five) working days and send the Client a reasoned written response.
10.3. If a dispute cannot be resolved through the claims procedure, either Party may apply to a court at the Provider's location.
## 11. Other provisions
11.1. The Client guarantees that they understand all terms of this Agreement and accept them unconditionally and in full.
11.2. For matters not governed by this Agreement, the Parties undertake to follow applicable Ukrainian law.
11.3. The Parties agree concerning all exclusive property rights in intellectual property created by the Provider and supplied to the Client in the course of providing services, including rights provided for by the Civil Code of Ukraine, the Law of Ukraine “On Copyright and Related Rights”, the Berne Convention for the Protection of Literary and Artistic Works (Paris Act of 24 July 1971, amended on 2 October 1979), the Universal Copyright Convention of 1952 and other international legal instruments.
11.4. The Parties undertake to protect personal data in accordance with the Law of Ukraine “On Personal Data Protection” of 1 June 2010, No. 2297-VI, ensure adequate protection against unlawful processing and access, and take necessary measures to prevent disclosure of the Client's personal data by the Parties and/or other authorized persons to whom such data was entrusted or became known in connection with their obligations under this Agreement.
## 12. Provider details
<strong>Sole proprietor Kurshatsov A. I.</strong>
Address: 24 Vlasenka Street, Kharkiv
EDRPOU: 2820213458
IBAN: UA333220010000026009340087400 at JSC “UNIVERSAL BANK”, bank code (MFO) 322001
Telephone: ${phone}
Email: ${email}
Website: ${site}
`);
