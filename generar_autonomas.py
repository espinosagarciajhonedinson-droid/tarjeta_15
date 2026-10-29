import os
import json
import re
import unicodedata
import base64
import io
import mimetypes
import qrcode
from PIL import Image

def clean_filename(name):
    name = unicodedata.normalize('NFKD', name).encode('ASCII', 'ignore').decode('utf-8')
    name = re.sub(r'[^\w\s-]', '', name).strip().lower()
    return re.sub(r'[-\s]+', '_', name)

def get_base64_image(file_path, mime_type="image/png"):
    if os.path.exists(file_path):
        with open(file_path, "rb") as f:
            encoded = base64.b64encode(f.read()).decode('utf-8')
            return f"data:{mime_type};base64,{encoded}"
    return ""

def generate_qr_base64(data_dict):
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=2,
    )
    qr.add_data(json.dumps(data_dict, ensure_ascii=False))
    qr.make(fit=True)
    img = qr.make_image(fill_color="#2E4626", back_color="#ffffff")
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    b64 = base64.b64encode(buffer.read()).decode('utf-8')
    return f"data:image/png;base64,{b64}"

def inline_vendor_script(html, script_tag, vendor_file):
    script = open(vendor_file, "r", encoding="utf-8").read()
    return html.replace(script_tag, f"<script>\n{script}\n</script>")

def inline_vendor_stylesheet(html, link_tag, vendor_file):
    with open(vendor_file, "r", encoding="utf-8") as stylesheet_file:
        stylesheet = stylesheet_file.read()

    def inline_asset(match):
        asset_url = match.group(2)
        if asset_url.startswith(("data:", "http://", "https://")):
            return match.group(0)

        asset_path = os.path.normpath(os.path.join(os.path.dirname(vendor_file), asset_url))
        with open(asset_path, "rb") as asset_file:
            encoded_asset = base64.b64encode(asset_file.read()).decode("ascii")
        mime_type = mimetypes.guess_type(asset_path)[0] or "application/octet-stream"
        return f'url("data:{mime_type};base64,{encoded_asset}")'

    stylesheet = re.sub(r'url\((["\']?)([^)]+?)\1\)', inline_asset, stylesheet)
    if link_tag not in html:
        raise ValueError(f"No se encontró la hoja de estilos esperada: {link_tag}")
    return html.replace(link_tag, f"<style>\n{stylesheet}\n</style>")

def remove_install_banner(html):
    html, banner_count = re.subn(
        r'\s*<!-- ====== BANNER INSTALACIÓN PWA / PANTALLA COMPLETA ======.*?'
        r'(?=\n    <script>\n    // ── Registro del Service Worker)',
        '',
        html,
        count=1,
        flags=re.DOTALL
    )
    if banner_count != 1:
        raise ValueError("No se encontró el banner de instalación esperado en la plantilla.")

    html, script_count = re.subn(
        r'\n    // ── Mostrar banner de instalación si NO está en modo standalone ──────────'
        r'.*?\n    }\n    </script>',
        '\n    </script>',
        html,
        count=1,
        flags=re.DOTALL
    )
    if script_count != 1:
        raise ValueError("No se encontró el código del banner de instalación esperado.")
    return html

def write_guest_manifest(output_dir, filename):
    manifest = {
        "id": f"./{filename}",
        "name": "Mis 15 Años - Vaiolet Nikol Jaelin",
        "short_name": "Invitación Vaiolet",
        "description": "Invitación Digital a los 15 Años de Vaiolet Nikol Jaelin Espinosa Cantello",
        "start_url": f"./{filename}",
        "scope": "../",
        "display": "standalone",
        "display_override": ["standalone"],
        "orientation": "portrait",
        "background_color": "#cde8af",
        "theme_color": "#B88E39",
        "icons": [
            {"src": "../assets/icon-180.png", "sizes": "180x180", "type": "image/png", "purpose": "any"},
            {"src": "../assets/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any"},
            {"src": "../assets/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}
        ],
        "lang": "es"
    }
    with open(os.path.join(output_dir, f"{filename}.webmanifest"), "w", encoding="utf-8") as output:
        json.dump(manifest, output, ensure_ascii=False, indent=2)

guests = [
    {"id": 1, "name": "Sr. Jorge Quina & Sra. Eneida Sandoval", "passes": 2},
    {"id": 2, "name": "Señorita Victoria Eugenia Quina Sandoval", "passes": 1},
    {"id": 3, "name": "Sr. Jhon, Sra. Esposa & Sofia Martinez", "passes": 3},
    {"id": 4, "name": "Andres Felipe Molina & Novia", "passes": 2},
    {"id": 5, "name": "Sra. Ruth Garcia Nieto", "passes": 1},
    {"id": 6, "name": "Sra. Blanca Nubia Garcia", "passes": 1},
    {"id": 7, "name": "Sr. David Andres Muñoz Garcia & Esposa", "passes": 2},
    {"id": 8, "name": "Daniel Leonardo Muñoz Garcia & Esposa", "passes": 2},
    {"id": 9, "name": "Sr. Edgar Alex Muñoz Legarda & Esposa", "passes": 2},
    {"id": 10, "name": "Sr. Edgar Anibal Muñoz Legarda", "passes": 1},
    {"id": 11, "name": "Sr. David Garcia Nieto & Esposa", "passes": 2},
    {"id": 12, "name": "Sr. Emerson Espinosa Herran & Esposa", "passes": 2},
    {"id": 14, "name": "Accehono Sanchez & Yenni Gomez", "passes": 2},
    {"id": 15, "name": "Familia Sanabria Carrasquilla", "passes": 4},
    {"id": 16, "name": "Sra. Ligia Garcia Nieto", "passes": 1},
    {"id": 17, "name": "Sr. Hansen Augusto Rodriguez y Esposa", "passes": 2},
    {"id": 18, "name": "Sr. Pedro Luis Martinez & Esposa", "passes": 2},
    {"id": 19, "name": "Juan Manuel Rodriguez", "passes": 1},
    {"id": 20, "name": "Jhon Edinson Steven Espinosa Barrero & Novia", "passes": 2},
    {"id": 21, "name": "Morena Hermosa Adriana Patricia Quina Sandoval", "passes": 1},
    {"id": 22, "name": "Sra. Nidia Sanabria & Esposo", "passes": 2},
    {"id": 23, "name": "Sra. Magaly Perez & Esposo", "passes": 2},
    {"id": 24, "name": "Clarita Triana", "passes": 1},
    {"id": 25, "name": "Señorita Ruth Aponte", "passes": 1},
    {"id": 26, "name": "Señorita Karen Corredor Cadavid", "passes": 1},
    {"id": 27, "name": "Señorita Maria Jose Diaz Aldana", "passes": 1},
    {"id": 28, "name": "Srta. Isabela Bermudez", "passes": 1},
    {"id": 29, "name": "Srta. Kamila Rodriguez Gomez", "passes": 1},
    {"id": 30, "name": "Srta. Karen Sofia Linarez Garcia", "passes": 1},
    {"id": 31, "name": "Edwin Santiago Ibañez Ruiz", "passes": 1},
    {"id": 32, "name": "Srta. Angie Dayana Garzon & Denzel Navarro", "passes": 2},
    {"id": 33, "name": "Jhulian Javier Trujillo Cruz", "passes": 1},
    {"id": 34, "name": "Michel Steven Legro", "passes": 1},
    {"id": 35, "name": "Sergio David Suarez", "passes": 1},
    {"id": 36, "name": "Angel Andres Montealegre Santana", "passes": 1},
    {"id": 37, "name": "Johan Steven Naranjo & Leidy Rodriguez", "passes": 2},
    {"id": 38, "name": "Andres Felipe Rayo", "passes": 1},
    {"id": 39, "name": "Julio Danilo Da Silva", "passes": 1},
    {"id": 40, "name": "Dairo Oviedo Moreno", "passes": 1},
    {"id": 41, "name": "Juan David Gonzales", "passes": 1},
    {"id": 42, "name": "Carol Isabela Sierra", "passes": 1},
    {"id": 43, "name": "Miguel Angel Espinosa & Angela Palma", "passes": 2},
    {"id": 44, "name": "Yolanda Arias", "passes": 1},
    {"id": 45, "name": "Juana Arana García", "passes": 1},
    {"id": 46, "name": "Viviana Cobos & Laura Romero", "passes": 2},
    {"id": 47, "name": "Andrés Cobos García", "passes": 1},
    {"id": 48, "name": "Alejandro Romero Cobos", "passes": 1},
    {"id": 49, "name": "Paola Tau", "passes": 1},
    {"id": 50, "name": "Cielo Valentina Almonacid", "passes": 1},
    {
        "id": 51,
        "name": "Alberto Bonilla, Dilia Ortega & Sofia",
        "passes": 3,
        "confirmation_url": "https://docs.google.com/forms/d/e/1FAIpQLScKWUi7P4aejnbv4NrVak4d5YYn8zl5rTPM3tkbWC-gI7PfOg/viewform?usp=header"
    },
    {"id": 54, "name": "Jorge Alexander Gomez", "passes": 1},
    {"id": 56, "name": "Yeison Camargo", "passes": 1}
]

def generate_autonomous_invitations(guest_ids=None):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    assets_dir = os.path.join(base_dir, "assets")
    output_dir = os.path.join(base_dir, "invitaciones_autonomas")

    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    # Base64 assets
    b64_bg = get_base64_image(os.path.join(assets_dir, "pistachio_bg.png"), "image/png")
    b64_wax = get_base64_image(os.path.join(assets_dir, "wax_seal.png"), "image/png")
    b64_frame = get_base64_image(os.path.join(assets_dir, "pistachio_roses_frame.png"), "image/png")
    b64_portrait = get_base64_image(os.path.join(assets_dir, "vaiolet_portrait_clean.png"), "image/png")
    b64_hero_ref = get_base64_image(os.path.join(assets_dir, "hero_block_ref.jpg"), "image/jpeg")
    audio_path = os.path.join(assets_dir, "princesa_y_el_sapo_espanol.mp3")
    if not os.path.isfile(audio_path):
        raise FileNotFoundError(f"Falta el archivo de música requerido: {audio_path}")
    with open(audio_path, "rb") as audio_file:
        b64_music = "data:audio/mpeg;base64," + base64.b64encode(audio_file.read()).decode("ascii")

    with open(os.path.join(base_dir, "styles.css"), "r", encoding="utf-8") as f:
        css_content = f.read()

    # Inyectar imágenes base64 en CSS
    css_content = css_content.replace("url('assets/pistachio_bg.png')", f"url('{b64_bg}')")

    with open(os.path.join(base_dir, "app.js"), "r", encoding="utf-8") as f:
        js_content = f.read()

    with open(os.path.join(base_dir, "index.html"), "r", encoding="utf-8") as f:
        html_template = f.read()

    html_template = remove_install_banner(html_template)

    for script_tag, vendor_file in (
        ('<script src="assets/vendor/qrcode.min.js"></script>', os.path.join(assets_dir, "vendor", "qrcode.min.js")),
        ('<script src="assets/vendor/confetti.browser.js"></script>', os.path.join(assets_dir, "vendor", "confetti.browser.js")),
        ('<script src="assets/vendor/html2canvas.min.js"></script>', os.path.join(assets_dir, "vendor", "html2canvas.min.js")),
    ):
        html_template = inline_vendor_script(html_template, script_tag, vendor_file)

    html_template = html_template.replace(
        'href="manifest.json"',
        'href="{guest_manifest}"'
    )
    html_template = html_template.replace(
        "navigator.serviceWorker.register('sw.js')",
        "navigator.serviceWorker.register('../sw.js', { scope: '../' })"
    )
    html_template = html_template.replace(
        'href="assets/vendor/fonts.css"',
        'href="../assets/vendor/fonts.css"'
    )
    html_template = html_template.replace(
        'href="assets/vendor/fontawesome.min.css"',
        'href="../assets/vendor/fontawesome.min.css"'
    )

    # Reemplazar imágenes y audio con Base64 / URL directo
    html_template = html_template.replace('src="assets/wax_seal.png"', f'src="{b64_wax}"')
    html_template = html_template.replace('src="assets/pistachio_roses_frame.png"', f'src="{b64_frame}"')
    html_template = html_template.replace('src="assets/vaiolet_portrait_clean.png"', f'src="{b64_portrait}"')
    html_template = html_template.replace('src="assets/hero_block_ref.jpg"', f'src="{b64_hero_ref}"')
    html_template = html_template.replace(
        '<source src="assets/princesa_y_el_sapo_espanol.mp3" type="audio/mpeg">',
        f'<source src="{b64_music}" type="audio/mpeg">'
    )

    # Inlinear CSS y JS
    html_template = html_template.replace('<link rel="stylesheet" href="styles.css">', f'<style>\n{css_content}\n</style>')
    html_template = html_template.replace('<script src="app.js"></script>', f'<script>\n{js_content}\n</script>')

    generated_count = 0
    for guest in guests:
        if guest_ids is not None and guest["id"] not in guest_ids:
            continue

        code_clean = re.sub(r'[^A-Z0-9]', '', clean_filename(guest['name']).upper())[:12]
        unique_code = f"VAI15-{code_clean}-{guest['passes']}P-{guest['id']:03d}"

        # Caso especial Invitación 02 (Victoria Eugenia Quina Sandoval - Perro Ramón)
        has_pet = (guest["id"] == 2)
        pet_name = "Ramón" if has_pet else ""
        pet_note = "Ramón es integrante de la familia 🐶" if has_pet else ""

        guest_obj = {
            "name": guest["name"],
            "passes": guest["passes"],
            "hasPet": has_pet,
            "petName": pet_name,
            "note": pet_note,
            "code": unique_code
        }
        if "confirmation_url" in guest:
            guest_obj["confirmationUrl"] = guest["confirmation_url"]

        qr_data = {
            "evento": "Mis 15 Años - Vaiolet Nikol Jaelin Espinosa Cantello",
            "invitado": guest["name"],
            "pases": guest["passes"],
            "codigo": unique_code
        }
        qr_base64 = generate_qr_base64(qr_data)

        guest_json = json.dumps(guest_obj, indent=4, ensure_ascii=True)
        script_block = "// VARIABLE_PLANTILLA\n        window.CURRENT_GUEST = " + guest_json + ";"
        qr_inject = f'\n        window.PREGENERATED_QR = "{qr_base64}";'

        pattern = re.compile(r'// VARIABLE_PLANTILLA[\s\S]*?};')
        new_html = pattern.sub(lambda m: script_block + qr_inject, html_template)

        filename = f"{guest['id']:02d}_{clean_filename(guest['name'])}.html"
        new_html = new_html.replace("{guest_manifest}", f"{filename}.webmanifest")
        if "confirmation_url" in guest:
            new_html = inline_vendor_stylesheet(
                new_html,
                '<link rel="stylesheet" href="../assets/vendor/fonts.css">',
                os.path.join(assets_dir, "vendor", "fonts.css")
            )
            new_html = inline_vendor_stylesheet(
                new_html,
                '<link rel="stylesheet" href="../assets/vendor/fontawesome.min.css">',
                os.path.join(assets_dir, "vendor", "fontawesome.min.css")
            )
            new_html = new_html.replace(
                f'<link rel="manifest" href="{filename}.webmanifest">\n',
                ""
            )
            new_html = re.sub(
                r'    <script>\n    // ── Registro del Service Worker.*?\n    </script>\n',
                "",
                new_html,
                count=1,
                flags=re.DOTALL
            )
            new_html = re.sub(r'[ \t]+(?=\n)', "", new_html)
        filepath = os.path.join(output_dir, filename)

        with open(filepath, "w", encoding="utf-8") as out_f:
            out_f.write(new_html)

        write_guest_manifest(output_dir, filename)
        generated_count += 1
        print(f"📦 Autónoma -> {filename}")

    print(f"\n🎉 ¡{generated_count} invitaciones autónomas generadas con éxito en /invitaciones_autonomas/!")

if __name__ == "__main__":
    generate_autonomous_invitations()
