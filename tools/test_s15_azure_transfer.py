# -*- coding: utf-8 -*-
"""Contrato mínimo: S15 debe transferir lo enseñado en S14 hacia familias Azure."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def test_azure_transfer_contract() -> None:
    loader = (ROOT / 'assets/learning/s15-autograder-v6.js').read_text(encoding='utf-8')
    runtime = (ROOT / 'assets/learning/s15-azure-transfer-v1.js').read_text(encoding='utf-8')
    s14 = (ROOT / 'Presentaciones/M5/sesion-14-bigquery-anidados-mapa-azure.html').read_text(encoding='utf-8')
    generator = (ROOT / 'tools/actualizar_s15_auto.py').read_text(encoding='utf-8')

    assert 's15-azure-transfer-v1.js' in loader
    assert 'azure_transfer' in runtime and 'learning-autograde-s15' in runtime

    for token in ('object_files', 'operational_document', 'lakehouse_analytics', 'bi_consumption'):
        assert token in runtime
    for token in ('blob_adls', 'cosmos', 'fabric_databricks', 'power_bi'):
        assert token in runtime

    # La evaluación no puede introducir familias que S14 no enseñó.
    for token in ('Azure Blob Storage / ADLS Gen2', 'Azure Cosmos DB', 'Microsoft Fabric / Azure Databricks', 'Power BI'):
        assert token in s14

    # El generador/sincronizador debe conservar el módulo en revision/.
    assert "'assets/learning/s15-azure-transfer-v1.js'" in generator
    assert 'transferencia Azure' in generator


if __name__ == '__main__':
    test_azure_transfer_contract()
    print('OK · S15 Azure transfer contract')
