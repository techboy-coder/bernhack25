# Glasklar

## Challenge: SpendCast

Technische Informationen für die Jury

### Aktueller Stand des Sourcecodes

- [GitHub](https://github.com/techboy-coder/bernhack25)

### Ausgangslage

Fokus:
- Unser Fokus lag darauf, eine möglichst intuitive und benutzerfreundliche
  Webseite zu erstellen.
- Ein ansprechendes Design fanden wir essenziell.
- Wir wollten das Meiste aus der Zeit herausholen und haben Entscheidungen
  dementsprechend getroffen.

Technischen Grundsatzentscheide:
- Die unorthodoxeste Entscheidung war, den gegebenen MCP Server nicht direkt zu
  verwenden, da wir nicht verlässlich SPARQL Querries generieren konnten.
  Anstatt dessen wurde die GraphDB Datebank manuell zu JSON gedumpt und
  der Inhalt mit JMESPath abgefragt.
- Sonst versuchten wir best practices zu folgen, das Rad nicht neuzuerfinden,
  und Lösungen zu verwenden, mit denen wir halbwegs vertraut waren.

### Technischer Aufbau

Verwendete Komponenten und Frameworks:
- Sprachen:
    - TypeScript: Fast alles
    - Python: OCR Service für Rechnungen
    - JavaScript, CSS, HTML
- Frameworks:
    - Svelte
- AI:
    - Ollama 3.1, gpt-oss (selfhosted)
    - GPT-4o-mini (third party)
- Weitere Dependencies: Bun, Hono, Flask, Docker, Tesseract (OCR), ...

### Implementation

Spezielles an der Implementation:
- Es wurden mehrere AI Agents verwendet, manche selbst gehostet, manche von
  Drittanbieter.
- Wir haben eine eigene (MCP ähnliche) Querry Layer für die Daten geschrieben.
  Diese hat viel besser funktioniert, als der zur Verfügung gestellte MCP Server.

### Abgrenzung / Offene Punkte

Welche Abgrenzungen habt ihr bewusst vorgenommen und damit nicht implementiert? Weshalb?
- Wir haben ein Feature entwickelt mit der man aus dem Photo einer Rechnung
  die Daten extrahieren kann und zu den anderen Transaktionen hinzufügen kann.
  Jedoch konnten wir das nicht mehr in die UI integrieren, da wir unzureichend
  Zeit hatten. Der Backend dafür ist nichtsdestotrotz schon fertiggestellt und
  funktionsfähig.
- Wir haben versucht, Daten aus OpenFoodFact zu den gekauften Waren zu beziehen.
  Es erwies sich relativ schwer, verlässlich den richtigen Eintrag (falls vorhanden)
  auszuwählen und es schien nur begrenzt sinnvoll (insbesondere aufgrund
  selbstgenerierten Datensätze), deshalb haben wir es nicht fertigimplementiert.
