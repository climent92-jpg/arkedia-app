# ARK#ÈDIA — La nova app de l'escola
### Presentació per a Direcció

*Portal de l'alumnat, del professorat i d'administració, tots connectats en temps real.*

---

## 1. Portada i introducció

### Què és Arkèdia?

Arkèdia és l'aplicació pròpia de l'escola de música: un únic sistema on **alumnat, professorat i administració** comparteixen la mateixa informació en temps real — horaris, deures, partitures, vídeos i comunicació directa — sense fulls de càlcul dispersos, grups de WhatsApp improvisats ni papers que es perden.

### Quina necessitat resol?

Avui, la gestió diària de l'escola es reparteix entre eines que no es parlen entre elles:

- L'horari viu en un Excel que només actualitza una persona.
- Els deures i el material es passen per correu, WhatsApp o en paper a classe.
- No hi ha manera senzilla que un alumne entregui un vídeo de la seva pràctica i que el professor el revisi sense dependre d'enllaços externs.
- Donar d'alta un usuari, canviar-li la contrasenya o reassignar-li un professor és un procés manual i lent.

**Arkèdia centralitza tot això en una sola aplicació**, amb un portal diferent — però connectat — per a cada rol: l'alumne/família, el professorat i la direcció.

---

## 2. Arquitectura i estalvi de costos (PWA)

### Una app real, sense passar per cap botiga d'aplicacions

Arkèdia es distribueix com a **Progressive Web App (PWA)**: l'alumnat i el professorat l'instal·len al mòbil directament des del navegador ("Afegeix a la pantalla d'inici"), i queda com qualsevol altra app — icona pròpia, pantalla completa, funciona offline pel que fa a la interfície.

### L'estalvi que això representa

| | Amb App Store / Google Play | Amb Arkèdia (PWA) |
|---|---|---|
| Cost anual de desenvolupador | **99 $/any** (Apple Developer Program) + 25 $ únics (Google Play) | **0 €** |
| Revisió i aprovació per publicar canvis | Dies o setmanes, subjecta a criteri de la botiga | Immediat, l'escola controla el desplegament |
| Comissions per funcionalitats futures (pagaments, subscripcions) | Fins a un 30% per a Apple/Google | Cap intermediari |
| Actualitzacions | L'usuari ha d'actualitzar manualment | Sempre la versió més recent, sense fer res |

En resum: **la mateixa experiència d'app mòbil, sense cap cost recurrent ni dependència d'Apple o Google.**

### Sota el capó

- **Next.js 16** (aplicació web moderna) + **Supabase** (base de dades, autenticació i emmagatzematge de fitxers al núvol).
- Seguretat a nivell de base de dades (*Row Level Security*): cada usuari només pot veure i modificar les seves pròpies dades — un alumne mai pot veure els deures d'un altre, ni un professor les dades d'alumnes que no té assignats.
- Desplegament continu: cada millora es publica en minuts.

---

## 3. Portal de l'Alumne

El portal de l'alumne (i la seva família) té quatre eixos:

### 📚 Repositori de material
L'alumne consulta, en qualsevol moment, tot el material que li ha penjat el seu professorat:
- **Partitures** (PDF) organitzades per professor.
- **Vídeos docents** (exemples, exercicis) enviats pel professor, individualment o a tot el grup d'alumnes d'un cop.

### 🎥 Lliurament de deures en vídeo
Quan un professor marca un deure com a "requereix vídeo de resposta", l'alumne pot:
- Gravar o pujar un vídeo directament des del mòbil (fins a **200 MB**, pensat per a vídeos reals de pràctica, no captures minúscules).
- Afegir una nota escrita explicant el que ha treballat o els dubtes que té.
- Substituir el vídeo si en vol enviar una versió millor abans que el professor el revisi.

### ✅ Seguiment dels deures
Tots els deures assignats, amb data límit i estat (pendent / fet), i el deure es marca automàticament com a fet en el moment que s'hi adjunta el vídeo requerit.

### 💬 Comunicació directa
Un xat privat amb cadascun dels seus professors, sense sortir de l'aplicació.

---

## 4. Portal del Professorat

El professorat té el control total de la relació pedagògica amb el seu alumnat:

### 📝 Creació de deures
Formulari senzill per assignar un deure a un alumne concret: títol, descripció, data límit i, quan calgui, **marcar-lo com a "requereix vídeo de resposta"** — el sistema s'encarrega de mostrar el requisit a l'alumne i de recollir el lliurament.

### ▶️ Revisió dels lliuraments
El professor veu, dins la mateixa fitxa del deure, el vídeo que li ha enviat l'alumne (reproductor integrat, sense descarregar res) i la nota que l'acompanya.

### 📤 Material propi
Igual que a l'inrevés, el professor puja partitures, vídeos o àudios — a un alumne concret o a tot el seu alumnat d'un sol cop — i desapareixen automàticament de la vista quan ja no calen.

### 👥 Visió completa del seu alumnat
Agenda setmanal, fitxa de cada alumne amb els contactes de família, i els avisos de direcció rellevants per al professorat.

> **Nota per a direcció**: el canal de feedback escrit del professor sobre el vídeo (més enllà de marcar-lo com a revisat) és el següent pas natural de desenvolupament — vegeu "Propers passos".

---

## 5. Portal d'Administració

Direcció té el control total de l'escola des d'un sol lloc:

### 👤 Gestió d'usuaris i rols
- Alta, edició i baixa de professorat i alumnat, amb els seus contactes de família.
- Assignació (i reassignació, en qualsevol moment) de quin professor porta cada alumne.
- Tres rols clarament diferenciats: **Alumne/Família**, **Professorat** i **Administració**, cadascun veient només el que li correspon.

### 🔑 Seguretat i contrasenyes
- En crear un usuari nou, es genera una contrasenya temporal i es mostra en un diàleg clar, pensat per copiar-la i compartir-la de forma segura.
- **Canvi de contrasenya en qualsevol moment**: direcció el pot fer per a qualsevol usuari des del seu panell; cada alumne/família el pot fer per si mateix des del seu propi perfil.
- Totes les dades viatgen xifrades i cada usuari només accedeix al que li pertoca (seguretat aplicada a nivell de base de dades, no només a la interfície).

### 🗓️ Horaris i importació
- Creació manual d'una classe (professor, alumne, dia, hora, instrument) en segons.
- Importador de CSV/Excel per bolcar horaris sencers d'un cop, sense duplicar-los si es reimporten.

### 📢 Comunicació institucional
Avisos dirigits a tota l'escola, només al professorat o només a les famílies, visibles a l'instant a cada portal corresponent.

---

## 6. Cloenda i propers passos

### Impacte pedagògic

Arkèdia no és només una eina de gestió: **connecta directament la pràctica de l'alumne amb el seguiment del professor**. El vídeo de resposta a un deure converteix una tasca abstracta ("practica aquesta setmana") en una evidència concreta que el professor pot revisar quan li vagi bé, i l'alumne rep la confirmació immediata que la seva feina ha arribat.

### Facilitat de desplegament

- No cal instal·lar res als ordinadors de l'escola: tot funciona des del navegador.
- L'alumnat i el professorat ja existent es pot donar d'alta en minuts des del panell d'administració.
- Sense contractes ni llicències per usuari: l'única infraestructura és el projecte de Supabase (base de dades + emmagatzematge), amb un pla gratuït que cobreix còmodament l'escala d'una escola de música.

### Propers passos suggerits

1. **Feedback escrit del professor** sobre el vídeo de resposta d'un deure (més enllà del "revisat"/"pendent" actual).
2. **Notificacions push** quan arriba un deure nou, un vídeo és revisat, o hi ha un missatge nou al xat.
3. **Estadístiques per a direcció**: percentatge de deures completats per grup, activitat setmanal de l'escola.
4. **Facturació i pagaments de mensualitats** integrats al mateix portal de família.

---

*Document preparat com a suport per a la presentació d'Arkèdia a direcció. Per a qualsevol detall tècnic addicional, consulteu `README.md` a l'arrel del projecte.*
