import os
import sys
import shutil
import pdfkit


def find_wkhtmltopdf():
	# 1) check env var
	env_path = os.environ.get('WKHTMLTOPDF_PATH')
	if env_path and os.path.isfile(env_path):
		return env_path

	# 2) check in PATH
	which = shutil.which('wkhtmltopdf')
	if which:
		return which

	# 3) common Windows install locations
	common = [
		r"C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe",
		r"C:\Program Files (x86)\wkhtmltopdf\bin\wkhtmltopdf.exe",
	]
	for p in common:
		if os.path.isfile(p):
			return p

	return None


WK = find_wkhtmltopdf()

if WK:
	# Use pdfkit with wkhtmltopdf
	config = pdfkit.configuration(wkhtmltopdf=WK)
	try:
		pdfkit.from_file("test.html", "report.pdf", configuration=config)
		print(f"report.pdf generated successfully using wkhtmltopdf at: {WK}")
		sys.exit(0)
	except OSError as e:
		sys.stderr.write("Failed to generate PDF using wkhtmltopdf: %s\n" % e)
		# fall through to fallback option
else:
	print("wkhtmltopdf not found — attempting pyppeteer fallback (no wkhtmltopdf required)...")

# Fallback: try pyppeteer (headless Chromium) to render the local HTML to PDF
try:
	import asyncio
	from pyppeteer import launch
except Exception:
	sys.stderr.write(
		"Fallback renderer 'pyppeteer' is not installed.\n"
		"Install it using: pip install pyppeteer\n"
		"Or install wkhtmltopdf and try again.\n"
	)
	sys.exit(2)


async def _render_with_pyppeteer(input_path: str, output_path: str):
	browser = await launch()
	page = await browser.newPage()
	file_url = 'file://' + os.path.abspath(input_path).replace('\\', '/')
	await page.goto(file_url, {'waitUntil': 'networkidle2'})
	await page.pdf({
		'path': output_path,
		'format': 'A4',
		'printBackground': True,
		'margin': {'top': '20mm', 'bottom': '20mm', 'left': '15mm', 'right': '15mm'}
	})
	await browser.close()


try:
	asyncio.get_event_loop().run_until_complete(_render_with_pyppeteer('test.html', 'report.pdf'))
	print('report.pdf generated successfully using pyppeteer')
	sys.exit(0)
except Exception as e:
	# Common failure: Chromium download unavailable. Try to use a locally installed Chrome/Edge.
	sys.stderr.write(f"pyppeteer rendering failed: {e}\n")

	# Try to find a local Chrome/Edge executable
	def find_local_browser():
		candidates = [
			r"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
			r"C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
			r"C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
			r"C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
		]
		for p in candidates:
			if os.path.isfile(p):
				return p
		# fallback to PATH lookup
		for name in ("chrome", "chrome.exe", "msedge", "msedge.exe", "brave", "brave.exe"):
			w = shutil.which(name)
			if w:
				return w
		return None

	local = find_local_browser()
	if local:
		try:
			async def _render_with_local(input_path, output_path, executable):
				browser = await launch(executablePath=executable, args=['--no-sandbox', '--disable-gpu'])
				page = await browser.newPage()
				file_url = 'file://' + os.path.abspath(input_path).replace('\\', '/')
				await page.goto(file_url, {'waitUntil': 'networkidle2'})
				await page.pdf({
					'path': output_path,
					'format': 'A4',
					'printBackground': True,
					'margin': {'top': '20mm', 'bottom': '20mm', 'left': '15mm', 'right': '15mm'}
				})
				await browser.close()

			asyncio.get_event_loop().run_until_complete(_render_with_local('test.html', 'report.pdf', local))
			print(f'report.pdf generated successfully using local browser at: {local}')
			sys.exit(0)
		except Exception as e2:
			sys.stderr.write(f"Local browser rendering failed: {e2}\n")

	# As a last resort produce a simple text-only PDF using ReportLab (will not match HTML layout)
	sys.stderr.write("Attempting text-only ReportLab fallback (simple PDF).\n")
	try:
		import textwrap
		from reportlab.lib.pagesizes import A4
		from reportlab.pdfgen import canvas
	except Exception:
		sys.stderr.write(
			"ReportLab is not installed. Install with: pip install reportlab\n"
			"Or install a browser (Chrome/Edge) so pyppeteer can use it.\n"
		)
		sys.exit(4)

	def generate_text_pdf_from_html(inpath, outpath):
		with open(inpath, 'r', encoding='utf-8', errors='ignore') as f:
			html = f.read()
		# crude tag stripper
		import re
		text = re.sub('<script[\s\S]*?</script>', '', html, flags=re.I)
		text = re.sub('<style[\s\S]*?</style>', '', text, flags=re.I)
		text = re.sub('<[^>]+>', '', text)
		lines = []
		for para in text.splitlines():
			para = para.strip()
			if not para:
				lines.append('')
				continue
			wrapped = textwrap.wrap(para, width=90)
			lines.extend(wrapped)

		c = canvas.Canvas(outpath, pagesize=A4)
		width, height = A4
		margin = 40
		y = height - margin
		textobj = c.beginText(margin, y)
		textobj.setFont('Helvetica', 10)
		leading = 12
		for ln in lines:
			if textobj.getY() < margin + leading:
				c.drawText(textobj)
				c.showPage()
				textobj = c.beginText(margin, height - margin)
				textobj.setFont('Helvetica', 10)
			textobj.textLine(ln)
		c.drawText(textobj)
		c.save()

	try:
		generate_text_pdf_from_html('test.html', 'report_bg.pdf')
		print('report.pdf generated (text-only) using ReportLab fallback')
		sys.exit(0)
	except Exception as e3:
		sys.stderr.write(f"ReportLab fallback failed: {e3}\n")
		sys.exit(5)