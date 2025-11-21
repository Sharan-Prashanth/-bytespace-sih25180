import tabula
import pandas as pd
import json

# Path to PDF
pdf_path = r"C:\Users\Shanmuga Shyam. B\OneDrive\Desktop\CompletedS_n_TProjects_06122022.pdf"


def pdfplumber_extract_tables(path: str) -> list:
    """Fallback extractor using pdfplumber. Returns list of DataFrames."""
    try:
        import pdfplumber
    except Exception:
        raise RuntimeError("pdfplumber is required for fallback extraction. Install with: pip install pdfplumber")

    dfs = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            try:
                tables_on_page = page.extract_tables()
            except Exception:
                continue
            for table in tables_on_page:
                if not table or len(table) < 2:
                    continue
                # first row is header, remaining rows are data
                header = [str(c).strip() for c in table[0]]
                rows = table[1:]
                try:
                    df = pd.DataFrame(rows, columns=header)
                except Exception:
                    # fallback: create DF without column names
                    df = pd.DataFrame(rows)
                dfs.append(df)
    return dfs


# Read all tables from PDF (try tabula first, fallback to pdfplumber)
try:
    tables = tabula.read_pdf(pdf_path, pages="all", multiple_tables=True, lattice=True)
except UnicodeDecodeError as ude:
    print("Tabula Unicode decode error, falling back to pdfplumber:", ude)
    tables = pdfplumber_extract_tables(pdf_path)
except Exception as e:
    print("Tabula failed, falling back to pdfplumber:", e)
    try:
        tables = pdfplumber_extract_tables(pdf_path)
    except Exception as e2:
        print("pdfplumber fallback also failed:", e2)
        raise


final_rows = []

for table in tables:
    # Standardize column names (they vary across pages)
    try:
        table.columns = [str(col).strip() for col in table.columns]
    except Exception:
        # table may not be a DataFrame with named columns; coerce
        table = pd.DataFrame(table)
        table.columns = [str(col).strip() for col in table.columns]

    # Identify matching columns (flexible matching)
    for _, row in table.iterrows():
        try:
            entry = {
                "S_No": row.get("S. No.", row.get("S.No.", row.get("S No", None))),
                "Implementing_Agency": row.get("Implementing Agency", row.get("Implementing\nAgency", None)),
                "Year_of_Completion": row.get("Year of completion", row.get("Year of\ncompletion", None)),
                "Cost_Lakh": row.get("Total Approved Cost (in lakh)", row.get("Total\nApproved\nCost\n(in lakh)", None))
            }

            # Only append valid rows
            if entry["Year_of_Completion"] not in [None, "", "nan"]:
                final_rows.append(entry)

        except Exception:
            continue

# Convert to JSON
json_output = json.dumps(final_rows, indent=4)

# Save to file
with open("completed_projects.json", "w", encoding="utf-8") as f:
    f.write(json_output)

print("Extraction complete. JSON saved as completed_projects.json.")
