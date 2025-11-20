import sys
import os
import argparse
import nbformat
from nbformat import v4 as nbf
from nbconvert.preprocessors import ExecutePreprocessor


def export_model_from_notebook(nb_path: str, model_variable: str, output_path: str, timeout: int = 600):
    """Execute the notebook at nb_path, append a cell which dumps `model_variable`
    using joblib to `output_path` and run the notebook. The notebook's own cells
    will run in order so any training code will execute before the save cell.

    Notes:
    - The notebook must run headlessly in the current environment (packages available).
    - If the notebook requires interactive inputs, the run may fail.
    """

    if not os.path.exists(nb_path):
        raise FileNotFoundError(nb_path)

    nb = nbformat.read(nb_path, as_version=4)

    # Create a cell to save the model variable
    save_code = f"""
try:
    import joblib
    joblib.dump({model_variable}, r'{output_path}')
    print('EXPORT_OK: saved {model_variable} to {output_path}')
except Exception as _e:
    print('EXPORT_ERROR:', _e)
    raise
"""

    save_cell = nbf.new_code_cell(save_code)
    nb.cells.append(save_cell)

    ep = ExecutePreprocessor(timeout=timeout, kernel_name='python3')

    # Run in the notebook's directory so relative imports/paths work
    cwd = os.path.dirname(os.path.abspath(nb_path)) or os.getcwd()
    print(f"Executing notebook in {cwd} (this may take a while)...")

    try:
        ep.preprocess(nb, {'metadata': {'path': cwd}})
    except Exception as e:
        # Pass through the exception but include a helpful message
        raise RuntimeError(f"Notebook execution failed: {e}")

    # If we reach here, the appended cell ran; check for output file
    if os.path.exists(output_path):
        print(f"Model export successful: {output_path}")
    else:
        raise RuntimeError(f"Notebook ran but {output_path} was not created.")


def main():
    p = argparse.ArgumentParser(description='Run a notebook and export a model variable to joblib')
    p.add_argument('notebook', help='Path to the .ipynb notebook')
    p.add_argument('variable', help='Name of the trained model variable inside the notebook (e.g. trained_model)')
    p.add_argument('output', help='Path to write the joblib file (e.g. model.joblib)')
    p.add_argument('--timeout', type=int, default=600, help='Execution timeout in seconds')

    args = p.parse_args()

    try:
        export_model_from_notebook(args.notebook, args.variable, args.output, timeout=args.timeout)
    except Exception as e:
        print('ERROR:', e)
        sys.exit(2)


if __name__ == '__main__':
    main()
