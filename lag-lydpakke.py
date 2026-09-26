#!/usr/bin/env python3
"""Oppdagerøya – lager den norske språkpakken.

Hvorfor denne finnes
--------------------
På iPhone og iPad gir Safari bare de enkle systemstemmene til nettsider. De
forbedrede norske stemmene man laster ned under Innstillinger →
Tilgjengelighet → Talt innhold kan ikke velges av en nettside i det hele tatt,
og Apple har svart at det er slik det skal være. Ingen innstilling i spillet
kan hente dem fram.

Derfor bruker ikke spillet talesyntese i det hele tatt når det kan unngås. Alt
det sier er lest inn på forhånd med en norsk nevral stemme og ligger som
lydfiler i `lyd/`. Da høres spillet likt ut på alle maskiner – iPhone, iPad,
Mac, Windows, Android – uten at noen trenger å gjøre noe.

Stemmen
-------
Piper-stemmen `no_NO-talesyntese-medium`, en VITS-modell trent på Språkbankens
talesyntesekorpus fra Nasjonalbiblioteket. Datasettet er CC0. Modellen lastes
ned fra sherpa-onnx sine utgivelser første gang skriptet kjøres.

Bruk
----
    pip install sherpa-onnx lameenc numpy
    python3 lag-lydpakke.py          lager klippene som mangler
    python3 lag-lydpakke.py --alt    lager alle på nytt

Ferdige filer trengs bare å lages på nytt hvis ordene i js/data.js endres.
Klippene ligger i repoet, så spillet virker uten at noen kjører dette.
"""

import json
import os
import subprocess
import sys
import tarfile
import urllib.request

ROT = os.path.dirname(os.path.abspath(__file__))
UT = os.path.join(ROT, 'lyd')
STEMMEMAPPE = os.path.join(ROT, 'stemme')
MODELLNAVN = 'vits-piper-no_NO-talesyntese-medium'
MODELL_URL = ('https://github.com/k2-fsa/sherpa-onnx/releases/download/'
              'tts-models/' + MODELLNAVN + '.tar.bz2')

# Litt under normal fart. En treåring trenger tid mellom stavelsene, og
# stemmen slurer ikke av dette slik talesyntesene gjør når man drar farten ned.
FART = 0.92

# Mono, 22,05 kHz, 48 kbit/s. Mp3 er det eneste formatet som spilles av alle
# nettlesere uten forbehold – særlig Safari på iPhone, som er hele grunnen til
# at pakken finnes.
BITRATE = 48


def replikker():
    """Henter replikklista fra spillets egne data, med node.

    Lista bygges av js/replikker.js av nøyaktig de samme formlene som talen
    bruker. Skrives den av for hånd her, råtner den første gang et ord byttes.
    """
    js = r"""
    var vm = require('vm'), fs = require('fs');
    var ctx = { module: { exports: {} }, console: console };
    vm.createContext(ctx);
    vm.runInContext(fs.readFileSync('js/data.js', 'utf8'), ctx);
    vm.runInContext(fs.readFileSync('js/replikker.js', 'utf8'), ctx);
    /* Alle navnene figurene kan få, så rosen passer uansett hva barnet velger. */
    var navn = {};
    Object.keys(ctx.VERDENER).forEach(function (id) {
      navn[id] = ctx.VERDENER[id].navneforslag;
    });
    var liste = ctx.Replikker.alle(navn);
    liste.forEach(function (r) { r.nokkel = ctx.Replikker.nokkel(r.tekst); });
    process.stdout.write(JSON.stringify(liste));
    """
    ut = subprocess.run(['node', '-e', js], cwd=ROT, capture_output=True, text=True)
    if ut.returncode:
        sys.exit('Fikk ikke replikklista fra node:\n' + ut.stderr)
    return json.loads(ut.stdout)


def hent_modell():
    mappe = os.path.join(STEMMEMAPPE, MODELLNAVN)
    if os.path.isdir(mappe):
        return mappe
    os.makedirs(STEMMEMAPPE, exist_ok=True)
    arkiv = mappe + '.tar.bz2'
    print('Laster ned stemmen (~64 MB) …')
    urllib.request.urlretrieve(MODELL_URL, arkiv)
    print('Pakker ut …')
    with tarfile.open(arkiv, 'r:bz2') as t:
        t.extractall(STEMMEMAPPE)
    os.remove(arkiv)
    return mappe


def lag_tts(mappe):
    import sherpa_onnx
    return sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(
        model=sherpa_onnx.OfflineTtsModelConfig(
            vits=sherpa_onnx.OfflineTtsVitsModelConfig(
                model=os.path.join(mappe, 'no_NO-talesyntese-medium.onnx'),
                tokens=os.path.join(mappe, 'tokens.txt'),
                data_dir=os.path.join(mappe, 'espeak-ng-data'),
            ),
            num_threads=4, provider='cpu',
        ),
        max_num_sentences=1,
    ))


def stell(lyd, sr):
    """Klipper vekk stillheten, jevner ut styrken og myker kantene.

    Uten dette blir noen klipp merkbart svakere enn andre, og et barn som
    skrur volumet etter det svakeste får et smell på det sterkeste. Stillheten
    foran og bak er heller ikke gratis: pausene i spillet er lagt inn med
    vilje, og da skal ikke klippene ha sine egne på toppen.
    """
    import numpy as np
    x = np.asarray(lyd, dtype=np.float32)
    if x.size == 0:
        return x

    # Fjern stillhet: alt under 1,5 % av toppen regnes som ingenting.
    grense = max(float(np.abs(x).max()) * 0.015, 1e-4)
    over = np.where(np.abs(x) > grense)[0]
    if over.size:
        kant = int(sr * 0.02)          # 20 ms pust i hver ende
        x = x[max(0, over[0] - kant): min(x.size, over[-1] + kant)]

    # Samme styrke på alle klipp.
    topp = float(np.abs(x).max())
    if topp > 0:
        x = x * (0.89 / topp)

    # 6 ms inn og ut, ellers knepper det.
    n = min(int(sr * 0.006), x.size // 2)
    if n > 0:
        r = np.linspace(0.0, 1.0, n, dtype=np.float32)
        x[:n] *= r
        x[-n:] *= r[::-1]
    return x


def til_mp3(x, sr):
    import lameenc
    import numpy as np
    kode = lameenc.Encoder()
    kode.set_bit_rate(BITRATE)
    kode.set_in_sample_rate(sr)
    kode.set_channels(1)
    kode.set_quality(2)
    pcm = np.clip(x, -1.0, 1.0)
    pcm = (pcm * 32767.0).astype('<i2')
    return bytes(kode.encode(pcm.tobytes())) + bytes(kode.flush())


def vis_uttale(ord):
    """Skriver lydskriften for et ord, så en ny oppføring i UTTALE kan
    kontrolleres uten å måtte høre på klippet."""
    try:
        import espeakng_loader
        os.environ['PHONEMIZER_ESPEAK_LIBRARY'] = espeakng_loader.get_library_path()
        from phonemizer.backend import EspeakBackend
        from phonemizer.backend.espeak.wrapper import EspeakWrapper
        EspeakWrapper.set_library(espeakng_loader.get_library_path())
        try:
            EspeakWrapper.set_data_path(str(espeakng_loader.get_data_path()))
        except Exception:
            pass
    except ImportError:
        sys.exit('Trenger espeakng-loader og phonemizer:\n'
                 '  pip install espeakng-loader phonemizer')
    b = EspeakBackend('nb', with_stress=True)
    for o in ord:
        print('  %-20s → %s' % (o, b.phonemize([o])[0].strip()))


def main():
    if '--uttale' in sys.argv:
        vis_uttale(sys.argv[sys.argv.index('--uttale') + 1:])
        return

    liste = replikker()
    print('%d replikker å lese inn.' % len(liste))

    os.makedirs(UT, exist_ok=True)
    alt = '--alt' in sys.argv

    # Klipp som allerede finnes, lages ikke på nytt: det sparer tid, og et
    # ord han kjenner skal ikke plutselig høres litt annerledes ut. Klipp
    # ingen replikk peker på lenger, ryddes bort.
    # ponytail: et klipp kjennes igjen på filnavnet alene. Endres bare
    # UTTALE for et ord som har klipp, eller to setninger kortes ned til
    # samme filnavn, lages det ikke på nytt – kjør da med --alt (eller slett
    # det ene klippet). Lagre uttalen i manifestet hvis dette blir vanlig.
    trengs = set(r['id'] + '.mp3' for r in liste)
    for f in os.listdir(UT):
        if f.endswith('.mp3') and (alt or f not in trengs):
            os.remove(os.path.join(UT, f))
    nye = [r for r in liste if not os.path.exists(os.path.join(UT, r['id'] + '.mp3'))]
    print('%d mangler klipp.' % len(nye))
    if not alt:
        print('(Endret du uttalen av et ord som alt har klipp? Kjør med --alt.)')

    tts = lag_tts(hent_modell()) if nye else None
    manifest = {r['nokkel']: r['id'] + '.mp3' for r in liste}
    bytes_sum = 0
    korte = []
    for i, r in enumerate(nye):
        # «uttale» er teksten skrevet slik stemmen leser den riktig; for de
        # aller fleste replikkene er den lik teksten selv. Se UTTALE i data.js.
        a = tts.generate(r.get('uttale') or r['tekst'], sid=0, speed=FART)
        x = stell(a.samples, a.sample_rate)
        sekunder = x.size / a.sample_rate
        if sekunder < 0.12:
            korte.append((r['tekst'], sekunder))
        data = til_mp3(x, a.sample_rate)
        fil = r['id'] + '.mp3'
        with open(os.path.join(UT, fil), 'wb') as f:
            f.write(data)
        bytes_sum += len(data)
        print('  ' + r['tekst'])

    with open(os.path.join(UT, 'manifest.js'), 'w') as f:
        f.write(
            '/* Oppdagerøya – den norske språkpakken\n'
            ' *\n'
            ' * Laget av lag-lydpakke.py. Skrives over hver gang.\n'
            ' * Stemme: Piper no_NO-talesyntese-medium (VITS), trent på\n'
            ' * Språkbankens talesyntesekorpus fra Nasjonalbiblioteket (CC0).\n'
            ' *\n'
            ' * Nøkkelen er setningen slik spillet sier den, i små bokstaver.\n'
            ' */\n\n'
            'var LYDFILER = ' + json.dumps(manifest, ensure_ascii=False,
                                           indent=1, sort_keys=True) + ';\n')

    print('\nFerdig: %d klipp i pakken, %d nye (%.1f MB).' % (len(manifest), len(nye), bytes_sum / 1e6))
    if korte:
        print('Mistenkelig korte klipp (sjekk dem):')
        for t, s in korte[:10]:
            print('  %.2fs  %r' % (s, t))
    print('Kjør «node bygg-enfil.js» hvis du bruker enfil-utgaven.')


if __name__ == '__main__':
    main()
