Product Design Document: BOC Tariff Bot (Balikbayan Box Guide)
The BOC Tariff Bot is a RAG-powered digital assistant designed to help Overseas Filipino Workers (OFWs) and their families navigate the complex rules of the Bureau of Customs (BOC). By translating dense legal documents into actionable advice, the bot serves as a real-time consultant for shipping items to the Philippines.

1. Problem Statement
   Complexity: Users struggle to interpret 50-page Customs Administrative Orders (CAO) and the ASEAN Harmonized Tariff Nomenclature (AHTN).
   Financial Risk: Filipinos often face unexpected taxes or lose boxes to "fly-by-night" forwarders because they are unaware of specific limits, such as the 20-item limit for consumables.
   Tooling Gaps: Existing tools like the Philippine Tariff Finder are considered "clunky" and difficult for average users to navigate.
2. Target Audience
   OFWs: Sending padala (shipments) or pasalubong (gifts) from abroad.
   Consignees: Family members in the Philippines receiving boxes who need to verify tax-exempt status.
   Small Importers: Individuals checking duties for specific items like car parts or electronics.
3. High-Level Solution Architecture
   To maintain a cost-effective production environment, the solution utilizes a "Cheap-but-Real" RAG approach, prioritizing Gemini 2.0 Flash for its efficiency and native Taglish capabilities.
   Data Foundation: Scraped BOC guidelines and tariff tables processed via Document AI into clean JSON.
   Custom Retrieval: Uses Vertex AI Vector Search for semantic lookup, deployed only during active development/demo phases to stay within the $50/month budget.
   Logic Layer: Decoupled TypeScript calculators for strict Philippine customs thresholds.

4. Core Product Features
   Feature
   Description
   Tax-Exemption Calculator
   Tracks the ₱150,000 annual tax-free limit shared across 3 shipments per year for "Qualified Filipinos While Abroad".
   De Minimis Checker
   Automatically identifies if a small shipment worth ₱10,000 or less is exempt from all duties and taxes.
   Prohibited Item Alerts
   Flags regulated items (e.g., >2 bottles of wine, commercial electronics) and prohibited items (e.g., ukay-ukay bales, toy guns).
   Multimodal Tariff Finder
   Users can take a photo of an item or receipt; the bot identifies the AHTN code to estimate duties.
   +1
   Scam & Notice Grounding
   Uses Google Search Grounding to alert users of recent BOC notices regarding abandoned boxes or active scammers.

5. User Experience & Localization
   Taglish Support: The interface and AI logic are specifically tuned for local dialects, understanding terms like pasalubong, padala, and consignee.
   Professional Trust: Every response is backed by Check Grounding, citing exact sections of the Customs Modernization and Tariff Act (CMTA) to ensure advice is legally sound and trustworthy.
   Conversational Scenarios: The bot is optimized to answer common queries such as "How many chocolates can I send from Dubai?" or "Is there duty for a luxury watch?".

6. Success Metrics
   Accuracy: Successful mapping of user items to the correct AHTN tariff heading.
   User Confidence: High rate of users citing the bot's provided CMTA sections when dealing with forwarders or customs officials.
   Cost Efficiency: Maintaining the "always-on" components of the stack within the established $50 monthly budget through disciplined resource management.
