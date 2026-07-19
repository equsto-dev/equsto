# Katalog Fiyat Denetim Raporu (Full)

**Oluşturulma:** 2026-07-19T06:58:42.425Z
**Durum:** error
**Kur:** 1 EUR = 53.9243 TRY · 1 USD = 47.1411 TRY
**Süre:** 1622 ms
**Katalog ürün:** 9964
**Toplam sorun:** 1130

## Severity

| critical | high | medium | low |
|---------:|-----:|-------:|----:|
| 0 | 841 | 158 | 131 |

## Katman (L1–L4)

| Katman | Sorun |
|--------|------:|
| L1 | 0 |
| L2 | 0 |
| L3 | 816 |
| L4 | 65 |
| brand | 249 |

## Denetimler

- `L1_formula`: **ok** · checked 8272 · bad 0 · total 9964 · skip 1692
- `L2_source`: **ok** · checked 4029 · bad 0 · total 9964 · skip 166
- `L3_market`: **warn** · checked 8255 · bad 816 · total 8255
- `L4_anomaly`: **info** · bad 65 · total 6370
- `senox`: **warn** · total 214
- `yuksel_ithal`: **ok** · bad 0 · total 21
- `portabianco`: **error** · bad 88 · total 334
- `rational_compare`: **warn** · total 25

## Marka dağılımı

| Marka | Sorun |
|-------|------:|
| Öztiryakiler Endüstriyel Mutfak | 745 |
| senox | 137 |
| portabianco | 88 |
| PORTABIANCO | 71 |
| Pimak | 32 |
| rational | 24 |
| İnoksan | 7 |
| Atalay Endüstriyel Mutfak Ekipmanları | 6 |
| Vosco | 5 |
| Proso Profesyonel Soğutma | 5 |
| Şenox | 5 |
| Npicco | 3 |
| Yüksel Endüstriyel | 2 |

## L1

_Sorun yok._


## L2

_Sorun yok._


## L3

| Sev | Marka | SKU | Site | Beklenen | Mesaj |
|-----|-------|-----|-----:|---------:|-------|
| high | Öztiryakiler Endüstriyel Mutfak | `9890.ICPRO20.2G` | ₺1.660.541 | ₺746.103 | L3 oran: ödeme 64.9% (marka medyan 29.2%) — liste KDV dahil ₺2.558.614 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.ICPRO20.2E` | ₺1.469.718 | ₺660.363 | L3 oran: ödeme 64.9% (marka medyan 29.2%) — liste KDV dahil ₺2.264.588 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.ICCLS20.2G` | ₺1.427.510 | ₺641.399 | L3 oran: ödeme 64.9% (marka medyan 29.2%) — liste KDV dahil ₺2.199.553 |
| high | Öztiryakiler Endüstriyel Mutfak | `8919.OEF40.APSHT` | ₺2.057.123 | ₺1.322.456 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺4.535.105 |
| high | Öztiryakiler Endüstriyel Mutfak | `8919.OEF40.APHT` | ₺1.998.827 | ₺1.284.979 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺4.406.586 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.ICCLS20.2E` | ₺1.263.196 | ₺567.570 | L3 oran: ödeme 64.9% (marka medyan 29.2%) — liste KDV dahil ₺1.946.372 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.ICPRO20.1G` | ₺1.158.319 | ₺520.448 | L3 oran: ödeme 64.9% (marka medyan 29.2%) — liste KDV dahil ₺1.784.776 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.X2021.EG` | ₺1.712.785 | ₺1.101.092 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺3.775.982 |
| high | Öztiryakiler Endüstriyel Mutfak | `8919.OEF40.APS` | ₺1.616.584 | ₺1.039.247 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺3.563.896 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.ICPRO20.1E` | ₺1.025.318 | ₺460.689 | L3 oran: ödeme 64.9% (marka medyan 29.2%) — liste KDV dahil ₺1.579.844 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.ICPRO10.2G` | ₺1.016.082 | ₺456.539 | L3 oran: ödeme 64.9% (marka medyan 29.2%) — liste KDV dahil ₺1.565.612 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.ICCLS20.1G` | ₺995.620 | ₺447.345 | L3 oran: ödeme 64.9% (marka medyan 29.2%) — liste KDV dahil ₺1.534.084 |
| high | Öztiryakiler Endüstriyel Mutfak | `8919.OEF40.AP` | ₺1.525.577 | ₺980.742 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺3.363.264 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.X2021.EP` | ₺1.521.205 | ₺977.932 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺3.353.626 |
| high | Öztiryakiler Endüstriyel Mutfak | `8890.OF190.0L` | ₺1.518.384 | ₺976.118 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺3.347.407 |
| high | Öztiryakiler Endüstriyel Mutfak | `8919.OEF25.AP` | ₺1.362.186 | ₺875.703 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺3.003.055 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.ICCLS20.1E` | ₺881.508 | ₺396.073 | L3 oran: ödeme 64.9% (marka medyan 29.2%) — liste KDV dahil ₺1.358.255 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.ICPRO10.2E` | ₺875.874 | ₺393.542 | L3 oran: ödeme 64.9% (marka medyan 29.2%) — liste KDV dahil ₺1.349.575 |
| high | Öztiryakiler Endüstriyel Mutfak | `8919.OEF40.0P` | ₺1.343.401 | ₺863.627 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺2.961.643 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.XBC16.GP` | ₺1.298.171 | ₺834.551 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺2.861.929 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.ICCLS10.2G` | ₺798.336 | ₺358.703 | L3 oran: ödeme 64.9% (marka medyan 29.2%) — liste KDV dahil ₺1.230.101 |
| high | Öztiryakiler Endüstriyel Mutfak | `8890.OF130.0L` | ₺1.194.793 | ₺768.093 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺2.634.025 |
| high | Öztiryakiler Endüstriyel Mutfak | `8919.OEF25.0P` | ₺1.183.573 | ₺760.879 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺2.609.288 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.ICPRO62.G0` | ₺764.164 | ₺343.349 | L3 oran: ödeme 64.9% (marka medyan 29.2%) — liste KDV dahil ₺1.177.448 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.XBC16.EP` | ₺1.143.763 | ₺735.287 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺2.521.524 |
| high | Öztiryakiler Endüstriyel Mutfak | `8919.OEF40.0A` | ₺1.138.393 | ₺731.835 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺2.509.685 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.X2011.EP` | ₺1.132.326 | ₺727.934 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺2.496.308 |
| high | Öztiryakiler Endüstriyel Mutfak | `8919.OEF15.APSHT` | ₺1.088.437 | ₺699.719 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺2.399.552 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.ICPRO10.1G` | ₺703.110 | ₺315.917 | L3 oran: ödeme 64.9% (marka medyan 29.2%) — liste KDV dahil ₺1.083.374 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.ICCLS10.2E` | ₺688.654 | ₺309.421 | L3 oran: ödeme 64.9% (marka medyan 29.2%) — liste KDV dahil ₺1.061.101 |
| high | Öztiryakiler Endüstriyel Mutfak | `8919.OEF15.APHT` | ₺1.040.423 | ₺668.853 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺2.293.702 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.ICPRO62.E0` | ₺658.500 | ₺295.873 | L3 oran: ödeme 64.9% (marka medyan 29.2%) — liste KDV dahil ₺1.014.638 |
| high | Öztiryakiler Endüstriyel Mutfak | `8919.OEF25.0A` | ₺1.004.880 | ₺646.003 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺2.215.342 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.X1021.EG` | ₺983.636 | ₺632.347 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺2.168.510 |
| high | Öztiryakiler Endüstriyel Mutfak | `9840.CL60D.00` | ₺621.388 | ₺275.530 | L3 oran: ödeme 65.8% (marka medyan 29.2%) — liste KDV dahil ₺944.876 |
| high | Öztiryakiler Endüstriyel Mutfak | `8919.OEF40.00` | ₺956.299 | ₺614.772 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺2.108.243 |
| high | Öztiryakiler Endüstriyel Mutfak | `7819.15G11.11` | ₺459.818 | ₺124.153 | L3 oran: ödeme 108.0% (marka medyan 29.2%) — liste KDV dahil ₺425.758 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.ICPRO10.1E` | ₺606.269 | ₺272.405 | L3 oran: ödeme 64.9% (marka medyan 29.2%) — liste KDV dahil ₺934.159 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.ICCLS62.G0` | ₺600.678 | ₺269.892 | L3 oran: ödeme 64.9% (marka medyan 29.2%) — liste KDV dahil ₺925.543 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.X1021.EP` | ₺897.853 | ₺577.200 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.979.396 |
| high | Öztiryakiler Endüstriyel Mutfak | `8890.G2002.00` | ₺889.872 | ₺572.069 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.961.800 |
| high | Öztiryakiler Endüstriyel Mutfak | `8890.OF800.52` | ₺868.092 | ₺558.067 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.913.784 |
| high | Öztiryakiler Endüstriyel Mutfak | `9580.5000S.00` | ₺867.258 | ₺557.531 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.911.945 |
| high | Öztiryakiler Endüstriyel Mutfak | `7890.60400.7TE` | ₺423.534 | ₺114.356 | L3 oran: ödeme 108.0% (marka medyan 29.2%) — liste KDV dahil ₺392.161 |
| high | Öztiryakiler Endüstriyel Mutfak | `8919.OEF15.APS` | ₺865.212 | ₺556.215 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.907.432 |
| high | Öztiryakiler Endüstriyel Mutfak | `8890.OKF20.00` | ₺858.757 | ₺552.067 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.893.205 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.ICCLS10.1G` | ₺552.836 | ₺248.397 | L3 oran: ödeme 64.9% (marka medyan 29.2%) — liste KDV dahil ₺851.829 |
| high | Öztiryakiler Endüstriyel Mutfak | `7890.60400.7T` | ₺406.814 | ₺109.842 | L3 oran: ödeme 108.0% (marka medyan 29.2%) — liste KDV dahil ₺376.680 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.XBC16.E1` | ₺829.228 | ₺533.083 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.828.105 |
| high | Öztiryakiler Endüstriyel Mutfak | `7919.14018.03` | ₺405.107 | ₺109.380 | L3 oran: ödeme 108.0% (marka medyan 29.2%) — liste KDV dahil ₺375.099 |
| high | Öztiryakiler Endüstriyel Mutfak | `8919.OEF25.00` | ₺826.266 | ₺531.179 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.821.575 |
| high | Öztiryakiler Endüstriyel Mutfak | `8919.OEF15.AP` | ₺819.790 | ₺527.015 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.807.295 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.X2011.E1` | ₺812.072 | ₺522.054 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.790.282 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.ICCLS62.E0` | ₺517.878 | ₺232.689 | L3 oran: ödeme 64.9% (marka medyan 29.2%) — liste KDV dahil ₺797.963 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.ICPRO61.0G` | ₺514.274 | ₺231.070 | L3 oran: ödeme 64.9% (marka medyan 29.2%) — liste KDV dahil ₺792.411 |
| high | Öztiryakiler Endüstriyel Mutfak | `7864.N1.80703.70` | ₺384.190 | ₺103.733 | L3 oran: ödeme 108.0% (marka medyan 29.2%) — liste KDV dahil ₺355.732 |
| high | Öztiryakiler Endüstriyel Mutfak | `9580.1500S.P2GC` | ₺746.195 | ₺479.704 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.645.050 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.ICCLS10.1E` | ₺476.500 | ₺214.097 | L3 oran: ödeme 64.9% (marka medyan 29.2%) — liste KDV dahil ₺734.206 |
| high | Öztiryakiler Endüstriyel Mutfak | `8919.OEF15.0P` | ₺728.539 | ₺468.354 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.606.128 |
| high | Öztiryakiler Endüstriyel Mutfak | `9580.1500S.PLUS` | ₺710.192 | ₺456.559 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.565.679 |
| high | Öztiryakiler Endüstriyel Mutfak | `9580.1500S.PBP` | ₺697.138 | ₺448.166 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.536.898 |
| high | Öztiryakiler Endüstriyel Mutfak | `8890.G1702.00` | ₺693.852 | ₺446.054 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.529.655 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.XBC10.GP` | ₺686.258 | ₺441.172 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.512.914 |
| high | Öztiryakiler Endüstriyel Mutfak | `7919.06NMV.13` | ₺334.103 | ₺90.209 | L3 oran: ödeme 108.0% (marka medyan 29.2%) — liste KDV dahil ₺309.355 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.X1011.EG` | ₺666.242 | ₺428.305 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.468.788 |
| high | Öztiryakiler Endüstriyel Mutfak | `7919.06LMV.13` | ₺325.778 | ₺87.962 | L3 oran: ödeme 108.0% (marka medyan 29.2%) — liste KDV dahil ₺301.647 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.ICPRO61.E0` | ₺431.102 | ₺193.700 | L3 oran: ödeme 64.9% (marka medyan 29.2%) — liste KDV dahil ₺664.257 |
| high | Öztiryakiler Endüstriyel Mutfak | `9580.1500S.PB2` | ₺654.055 | ₺420.470 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.441.921 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.XBC10.EP` | ₺651.946 | ₺419.114 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.437.268 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.XCC10.13` | ₺651.946 | ₺419.114 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.437.268 |
| high | Öztiryakiler Endüstriyel Mutfak | `8890.OKF17.00` | ₺637.846 | ₺410.049 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.406.185 |
| high | Öztiryakiler Endüstriyel Mutfak | `8919.OEF15.0A` | ₺637.532 | ₺409.848 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.405.495 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.ICCLS61.0G` | ₺404.179 | ₺181.603 | L3 oran: ödeme 64.9% (marka medyan 29.2%) — liste KDV dahil ₺622.773 |
| high | Öztiryakiler Endüstriyel Mutfak | `9810.HL200.21` | ₺554.248 | ₺332.553 | L3 oran: ödeme 48.6% (marka medyan 29.2%) — liste KDV dahil ₺1.140.426 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.X1011.EP` | ₺606.194 | ₺389.702 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.336.408 |
| high | Öztiryakiler Endüstriyel Mutfak | `9805.FM480.AKE` | ₺520.404 | ₺307.502 | L3 oran: ödeme 49.3% (marka medyan 29.2%) — liste KDV dahil ₺1.054.517 |
| high | Öztiryakiler Endüstriyel Mutfak | `8890.MT120.03` | ₺578.729 | ₺372.045 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.275.856 |
| high | Öztiryakiler Endüstriyel Mutfak | `8919.OEF15.00` | ₺546.526 | ₺351.343 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.204.863 |
| high | Öztiryakiler Endüstriyel Mutfak | `9805.IM240N.EHC` | ₺475.099 | ₺280.731 | L3 oran: ödeme 49.3% (marka medyan 29.2%) — liste KDV dahil ₺962.714 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.ICPROXS.00` | ₺344.742 | ₺154.897 | L3 oran: ödeme 64.9% (marka medyan 29.2%) — liste KDV dahil ₺531.189 |
| high | Öztiryakiler Endüstriyel Mutfak | `9580.1300S.00` | ₺528.815 | ₺339.957 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.165.817 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.ICCLS61.E0` | ₺339.108 | ₺152.366 | L3 oran: ödeme 64.9% (marka medyan 29.2%) — liste KDV dahil ₺522.509 |
| high | Öztiryakiler Endüstriyel Mutfak | `8890.G1502.00` | ₺515.878 | ₺331.640 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.137.295 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.XBC06.GP` | ₺497.537 | ₺319.850 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.096.863 |
| high | Öztiryakiler Endüstriyel Mutfak | `9580.1300S.BM` | ₺492.318 | ₺316.495 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.085.358 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.X0711.EG` | ₺491.819 | ₺316.173 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.084.255 |
| high | Öztiryakiler Endüstriyel Mutfak | `8890.OKF15.00` | ₺491.608 | ₺316.038 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.083.791 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.XBC10.E1` | ₺486.100 | ₺312.497 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.071.648 |
| high | Öztiryakiler Endüstriyel Mutfak | `9805.AWNE.HC` | ₺415.846 | ₺245.719 | L3 oran: ödeme 49.4% (marka medyan 29.2%) — liste KDV dahil ₺842.644 |
| high | Öztiryakiler Endüstriyel Mutfak | `8890.MT800.03` | ₺472.939 | ₺304.037 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.042.635 |
| high | Öztiryakiler Endüstriyel Mutfak | `9840.CL55D.00` | ₺302.305 | ₺134.045 | L3 oran: ödeme 65.8% (marka medyan 29.2%) — liste KDV dahil ₺459.682 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.XBC06.EP` | ₺457.505 | ₺294.115 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.008.609 |
| high | Öztiryakiler Endüstriyel Mutfak | `9805.IM240A.NEH` | ₺397.344 | ₺234.786 | L3 oran: ödeme 49.4% (marka medyan 29.2%) — liste KDV dahil ₺805.154 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.X0711.EP` | ₺454.645 | ₺292.277 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.002.306 |
| high | Öztiryakiler Endüstriyel Mutfak | `9805.XNEHC.32` | ₺395.461 | ₺233.674 | L3 oran: ödeme 49.4% (marka medyan 29.2%) — liste KDV dahil ₺801.339 |
| high | Pimak | `PIMAK.E-SS37-4` | ₺361.434 | ₺201.138 | L3 oran: ödeme 100.0% (marka medyan 55.7%) — liste KDV dahil ₺361.434 |
| high | Öztiryakiler Endüstriyel Mutfak | `9805.XNEHC.23` | ₺387.683 | ₺229.078 | L3 oran: ödeme 49.3% (marka medyan 29.2%) — liste KDV dahil ₺785.579 |
| high | Öztiryakiler Endüstriyel Mutfak | `9805.240HC.23` | ₺387.683 | ₺229.078 | L3 oran: ödeme 49.3% (marka medyan 29.2%) — liste KDV dahil ₺785.579 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.XESW03.HS` | ₺434.630 | ₺279.409 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺958.179 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.X1011.E1` | ₺434.630 | ₺279.409 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺958.179 |
| high | Öztiryakiler Endüstriyel Mutfak | `9805.IM240D.NHC` | ₺376.958 | ₺222.741 | L3 oran: ödeme 49.3% (marka medyan 29.2%) — liste KDV dahil ₺763.849 |
| high | Öztiryakiler Endüstriyel Mutfak | `9805.IM240X.NHC` | ₺376.958 | ₺222.741 | L3 oran: ödeme 49.3% (marka medyan 29.2%) — liste KDV dahil ₺763.849 |
| high | Öztiryakiler Endüstriyel Mutfak | `8919.03850.00` | ₺423.475 | ₺272.238 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺933.587 |
| high | Öztiryakiler Endüstriyel Mutfak | `8890.MT120.02` | ₺412.784 | ₺265.365 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺910.019 |
| high | Öztiryakiler Endüstriyel Mutfak | `9805.SV545.00` | ₺401.630 | ₺258.194 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺885.427 |
| high | Öztiryakiler Endüstriyel Mutfak | `7890.12901.55` | ₺393.270 | ₺252.820 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺866.997 |
| high | Öztiryakiler Endüstriyel Mutfak | `8890.MD120.02` | ₺383.744 | ₺246.696 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺845.998 |
| high | Öztiryakiler Endüstriyel Mutfak | `8880.00500.00` | ₺383.744 | ₺246.696 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺845.998 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.X0511.EG` | ₺380.302 | ₺244.483 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺838.407 |
| high | Öztiryakiler Endüstriyel Mutfak | `8919.03225.00` | ₺376.100 | ₺241.782 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺829.145 |
| high | Öztiryakiler Endüstriyel Mutfak | `9574.B20HW.00` | ₺365.332 | ₺234.859 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺805.404 |
| high | Öztiryakiler Endüstriyel Mutfak | `8890.10570.M3` | ₺364.556 | ₺234.362 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺803.698 |
| high | Öztiryakiler Endüstriyel Mutfak | `9805.IM130N.EHC` | ₺314.233 | ₺185.677 | L3 oran: ödeme 49.4% (marka medyan 29.2%) — liste KDV dahil ₺636.743 |
| high | Öztiryakiler Endüstriyel Mutfak | `9805.IM100.HC` | ₺308.323 | ₺182.185 | L3 oran: ödeme 49.3% (marka medyan 29.2%) — liste KDV dahil ₺624.768 |
| high | Öztiryakiler Endüstriyel Mutfak | `9580.1100S.00` | ₺347.902 | ₺223.654 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺766.978 |
| high | Öztiryakiler Endüstriyel Mutfak | `9805.SPN40.50` | ₺346.711 | ₺222.889 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺764.356 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.X0711.E1` | ₺343.129 | ₺220.586 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺756.457 |
| high | Öztiryakiler Endüstriyel Mutfak | `8919.02912.00` | ₺340.184 | ₺218.693 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺749.965 |
| high | Öztiryakiler Endüstriyel Mutfak | `8890.MT800.02` | ₺336.036 | ₺216.026 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺740.819 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.XBC06.E1` | ₺334.550 | ₺215.071 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺737.546 |
| high | Öztiryakiler Endüstriyel Mutfak | `8358.OKM42.STR` | ₺327.257 | ₺210.382 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺721.466 |
| high | Öztiryakiler Endüstriyel Mutfak | `9580.APPIA.3V` | ₺326.375 | ₺209.816 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺719.522 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.XBC04.EP` | ₺325.972 | ₺209.557 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺718.634 |
| high | Pimak | `PIMAK.E-SS37-10` | ₺258.167 | ₺143.670 | L3 oran: ödeme 100.0% (marka medyan 55.7%) — liste KDV dahil ₺258.167 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.X0511.EP` | ₺320.254 | ₺205.880 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺706.027 |
| high | Öztiryakiler Endüstriyel Mutfak | `8880.00400.04` | ₺311.144 | ₺200.024 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺685.944 |
| high | Öztiryakiler Endüstriyel Mutfak | `0820.00050.11` | ₺308.777 | ₺198.502 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺680.725 |
| high | Öztiryakiler Endüstriyel Mutfak | `8890.MD800.02` | ₺306.996 | ₺197.357 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺676.798 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.XECC0.523EPR` | ₺305.957 | ₺196.689 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺674.508 |
| high | Öztiryakiler Endüstriyel Mutfak | `8919.02600.00` | ₺304.530 | ₺195.772 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺671.362 |
| high | Öztiryakiler Endüstriyel Mutfak | `9574.B10HW.00` | ₺302.806 | ₺194.664 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺667.563 |
| high | Öztiryakiler Endüstriyel Mutfak | `8823.DHM60.00` | ₺302.588 | ₺194.523 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺667.081 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.XEFT10.EU` | ₺297.379 | ₺191.175 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺655.596 |
| high | Öztiryakiler Endüstriyel Mutfak | `8860.OPS04.38` | ₺288.067 | ₺185.189 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺635.070 |
| high | Öztiryakiler Endüstriyel Mutfak | `8358.OKM42.TR` | ₺284.034 | ₺182.596 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺626.178 |
| high | Öztiryakiler Endüstriyel Mutfak | `0820.00030.11` | ₺282.844 | ₺181.830 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺623.551 |
| high | Öztiryakiler Endüstriyel Mutfak | `9823.50010.00` | ₺277.056 | ₺178.110 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺610.794 |
| high | Öztiryakiler Endüstriyel Mutfak | `9580.APPIA.3S` | ₺271.544 | ₺174.567 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺598.642 |
| high | Öztiryakiler Endüstriyel Mutfak | `8916.AV106.00` | ₺269.658 | ₺173.354 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺594.485 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.XBC04.E1` | ₺268.784 | ₺172.792 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺592.558 |
| high | Öztiryakiler Endüstriyel Mutfak | `9840.CL52D.00` | ₺170.032 | ₺75.394 | L3 oran: ödeme 65.8% (marka medyan 29.2%) — liste KDV dahil ₺258.548 |
| high | Pimak | `PIMAK.BE1/M037-6K` | ₺212.988 | ₺118.528 | L3 oran: ödeme 100.0% (marka medyan 55.7%) — liste KDV dahil ₺212.988 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.X0511.E1` | ₺263.066 | ₺169.116 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺579.950 |
| high | Öztiryakiler Endüstriyel Mutfak | `9805.SV325.00` | ₺260.578 | ₺167.517 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺574.466 |
| high | Öztiryakiler Endüstriyel Mutfak | `8919.02000.00` | ₺251.614 | ₺161.754 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺554.703 |
| high | Öztiryakiler Endüstriyel Mutfak | `9805.ODB41.4A` | ₺251.323 | ₺161.567 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺554.064 |
| high | PORTABIANCO | `DT-2NDGN` | ₺213.810 | ₺124.148 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺275.884 |
| high | Öztiryakiler Endüstriyel Mutfak | `8890.MD120.01` | ₺243.730 | ₺156.686 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺537.323 |
| high | Öztiryakiler Endüstriyel Mutfak | `9805.OFB32.0A` | ₺243.722 | ₺156.681 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺537.307 |
| high | PORTABIANCO | `DT-2NDGNE` | ₺206.381 | ₺119.834 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺266.298 |
| high | Pimak | `PIMAK.BE1/M037-6S` | ₺193.625 | ₺107.753 | L3 oran: ödeme 100.0% (marka medyan 55.7%) — liste KDV dahil ₺193.625 |
| high | Pimak | `PIMAK.M037-6SE` | ₺193.625 | ₺107.753 | L3 oran: ödeme 100.0% (marka medyan 55.7%) — liste KDV dahil ₺193.625 |
| high | Öztiryakiler Endüstriyel Mutfak | `8890.10570.DE` | ₺238.544 | ₺153.352 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺525.890 |
| high | Öztiryakiler Endüstriyel Mutfak | `8860.OPS03.38` | ₺237.508 | ₺152.685 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺523.604 |
| high | Öztiryakiler Endüstriyel Mutfak | `9805.IM65N.EHC` | ₺206.989 | ₺122.308 | L3 oran: ödeme 49.4% (marka medyan 29.2%) — liste KDV dahil ₺419.431 |
| high | Öztiryakiler Endüstriyel Mutfak | `9805.SPN25.50` | ₺232.350 | ₺149.370 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺512.235 |
| high | Öztiryakiler Endüstriyel Mutfak | `9805.SV225.00` | ₺228.898 | ₺147.151 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺504.625 |
| high | Öztiryakiler Endüstriyel Mutfak | `8860.OPS02.38` | ₺225.061 | ₺144.684 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺496.166 |
| high | Öztiryakiler Endüstriyel Mutfak | `8880.00250.04` | ₺224.024 | ₺144.017 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺493.880 |
| high | Öztiryakiler Endüstriyel Mutfak | `9580.APPIA.2VT` | ₺223.966 | ₺143.980 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺493.752 |
| high | Pimak | `PIMAK.BE1/M037-5K` | ₺171.036 | ₺95.182 | L3 oran: ödeme 100.0% (marka medyan 55.7%) — liste KDV dahil ₺171.036 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.XEFT06.EU` | ₺211.596 | ₺136.028 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺466.482 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.XBC02.EU` | ₺211.596 | ₺136.028 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺466.482 |
| high | Öztiryakiler Endüstriyel Mutfak | `8845.0CRG8.00` | ₺211.056 | ₺135.681 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺465.291 |
| high | PORTABIANCO | `SBM-4N70` | ₺179.575 | ₺104.269 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺231.709 |
| high | Öztiryakiler Endüstriyel Mutfak | `9860.000R5.00` | ₺134.923 | ₺59.826 | L3 oran: ödeme 65.8% (marka medyan 29.2%) — liste KDV dahil ₺205.163 |
| high | Pimak | `PIMAK.E-SS37-8` | ₺167.809 | ₺93.386 | L3 oran: ödeme 100.0% (marka medyan 55.7%) — liste KDV dahil ₺167.809 |
| high | Öztiryakiler Endüstriyel Mutfak | `8894.05500.00` | ₺207.430 | ₺133.349 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺457.296 |
| high | Öztiryakiler Endüstriyel Mutfak | `9805.SV145.00` | ₺205.864 | ₺132.342 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺453.842 |
| high | PORTABIANCO | `SBM-4N70E` | ₺174.274 | ₺101.191 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺224.869 |
| high | Öztiryakiler Endüstriyel Mutfak | `9805.SPN12.50` | ₺202.062 | ₺129.899 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺445.464 |
| high | Öztiryakiler Endüstriyel Mutfak | `8845.0CRG7.00` | ₺201.714 | ₺129.675 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺444.696 |
| high | Öztiryakiler Endüstriyel Mutfak | `9805.IM45N.EHC` | ₺175.340 | ₺103.607 | L3 oran: ödeme 49.3% (marka medyan 29.2%) — liste KDV dahil ₺355.299 |
| high | Öztiryakiler Endüstriyel Mutfak | `9805.IM45CNE.HC` | ₺175.340 | ₺103.607 | L3 oran: ödeme 49.3% (marka medyan 29.2%) — liste KDV dahil ₺355.299 |
| high | Öztiryakiler Endüstriyel Mutfak | `8760.01001.00` | ₺199.651 | ₺128.349 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺440.147 |
| high | Öztiryakiler Endüstriyel Mutfak | `8880.00200.02` | ₺198.096 | ₺127.349 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺436.718 |
| high | Öztiryakiler Endüstriyel Mutfak | `8823.0HA60.30` | ₺196.021 | ₺126.015 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺432.145 |
| high | Öztiryakiler Endüstriyel Mutfak | `7890.12908.54` | ₺193.691 | ₺124.518 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺427.010 |
| high | Öztiryakiler Endüstriyel Mutfak | `7890.12908.52` | ₺193.691 | ₺124.518 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺427.010 |
| high | Pimak | `PIMAK.E-SS37-3` | ₺154.900 | ₺86.202 | L3 oran: ödeme 100.0% (marka medyan 55.7%) — liste KDV dahil ₺154.900 |
| high | Pimak | `PIMAK.BE1/M037-5S` | ₺154.900 | ₺86.202 | L3 oran: ödeme 100.0% (marka medyan 55.7%) — liste KDV dahil ₺154.900 |
| high | Pimak | `PIMAK.M037-5SE` | ₺154.900 | ₺86.202 | L3 oran: ödeme 100.0% (marka medyan 55.7%) — liste KDV dahil ₺154.900 |
| high | Öztiryakiler Endüstriyel Mutfak | `9580.APPIA.CVG` | ₺191.995 | ₺123.427 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺423.271 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.XBC01.EU` | ₺191.580 | ₺123.161 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺422.355 |
| high | PORTABIANCO | `DT-2DGN-EKO` | ₺162.775 | ₺94.514 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺210.032 |
| high | PORTABIANCO | `DT-2DGN` | ₺162.775 | ₺94.514 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺210.032 |
| high | Öztiryakiler Endüstriyel Mutfak | `9912.SPR80.00` | ₺190.487 | ₺122.458 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺419.945 |
| high | PORTABIANCO | `SBH-4N70` | ₺161.393 | ₺93.712 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺208.250 |
| high | PORTABIANCO | `DT-2DGNE` | ₺160.647 | ₺93.279 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺207.286 |
| high | Öztiryakiler Endüstriyel Mutfak | `9805.ODB20.0A` | ₺188.051 | ₺120.891 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺414.572 |
| high | Öztiryakiler Endüstriyel Mutfak | `8919.00000.05` | ₺187.151 | ₺120.313 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺412.590 |
| high | Öztiryakiler Endüstriyel Mutfak | `8890.ME120.01` | ₺186.686 | ₺120.014 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺411.566 |
| high | Pimak | `PIMAK.BE/M037-3K` | ₺149.091 | ₺82.970 | L3 oran: ödeme 100.0% (marka medyan 55.7%) — liste KDV dahil ₺149.091 |
| high | PORTABIANCO | `SBB-4N70` | ₺156.465 | ₺90.851 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺201.891 |
| high | Öztiryakiler Endüstriyel Mutfak | `8845.0CRG6.00` | ₺179.434 | ₺115.352 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺395.577 |
| high | PORTABIANCO | `SBB-4N70E` | ₺151.575 | ₺88.011 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺195.580 |
| high | PORTABIANCO | `SBT-4N70` | ₺151.201 | ₺87.795 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺195.099 |
| high | Öztiryakiler Endüstriyel Mutfak | `9805.OFB16.5A` | ₺177.432 | ₺114.065 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺391.164 |
| high | PORTABIANCO | `TT-4D70` | ₺150.268 | ₺87.252 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺193.894 |
| high | Pimak | `PIMAK.E-SS37-6` | ₺141.992 | ₺79.019 | L3 oran: ödeme 100.0% (marka medyan 55.7%) — liste KDV dahil ₺141.992 |
| high | Pimak | `PIMAK.21/25-30/50` | ₺141.992 | ₺79.019 | L3 oran: ödeme 100.0% (marka medyan 55.7%) — liste KDV dahil ₺141.992 |
| high | PORTABIANCO | `TT-4D60` | ₺148.401 | ₺86.169 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺191.485 |
| high | Öztiryakiler Endüstriyel Mutfak | `8823.HHA60.M0` | ₺174.241 | ₺112.014 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺384.129 |
| high | PORTABIANCO | `SBT-4N70E` | ₺145.415 | ₺84.435 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺187.632 |
| high | PORTABIANCO | `SBH-4N70E` | ₺144.855 | ₺84.109 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺186.909 |
| high | PORTABIANCO | `SBM-3N70` | ₺144.145 | ₺83.698 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺185.994 |
| high | PORTABIANCO | `SBH-3N70` | ₺140.897 | ₺81.811 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺181.803 |
| high | Öztiryakiler Endüstriyel Mutfak | `8919.01037.00` | ₺165.335 | ₺106.288 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺364.494 |
| high | Öztiryakiler Endüstriyel Mutfak | `8477.SLUSH.36I` | ₺164.096 | ₺105.493 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺361.767 |
| high | PORTABIANCO | `SBM-3N70E` | ₺139.740 | ₺81.139 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺180.309 |
| high | Öztiryakiler Endüstriyel Mutfak | `9805.0B340.SA` | ₺161.650 | ₺103.919 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺356.371 |
| high | Öztiryakiler Endüstriyel Mutfak | `8573.CDE5S` | ₺161.173 | ₺103.613 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺355.319 |
| high | PORTABIANCO | `DT-2NGN-EKO` | ₺137.015 | ₺79.557 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺176.793 |
| high | PORTABIANCO | `DT-2NGN` | ₺137.015 | ₺79.557 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺176.793 |
| high | Öztiryakiler Endüstriyel Mutfak | `8880.00150.02` | ₺160.758 | ₺103.346 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺354.404 |
| high | Öztiryakiler Endüstriyel Mutfak | `8845.0CRG5.00` | ₺160.751 | ₺103.341 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺354.388 |
| high | Pimak | `PIMAK.BE/M037-3S` | ₺129.084 | ₺71.835 | L3 oran: ödeme 100.0% (marka medyan 55.7%) — liste KDV dahil ₺129.084 |
| high | Pimak | `PIMAK.M037-3SE` | ₺129.084 | ₺71.835 | L3 oran: ödeme 100.0% (marka medyan 55.7%) — liste KDV dahil ₺129.084 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.XEBDC.01` | ₺160.127 | ₺102.940 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺353.013 |
| high | Öztiryakiler Endüstriyel Mutfak | `8823.HHA55.M0` | ₺158.683 | ₺102.012 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺349.831 |
| high | PORTABIANCO | `TT-4D70-E` | ₺135.036 | ₺78.408 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺174.240 |
| high | PORTABIANCO | `DT-2NGNE` | ₺134.887 | ₺78.321 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺174.047 |
| high | Öztiryakiler Endüstriyel Mutfak | `9840.CL50D.00` | ₺100.034 | ₺44.356 | L3 oran: ödeme 65.8% (marka medyan 29.2%) — liste KDV dahil ₺152.110 |
| high | Öztiryakiler Endüstriyel Mutfak | `9805.IM30CN.EHC` | ₺135.668 | ₺80.165 | L3 oran: ödeme 49.4% (marka medyan 29.2%) — liste KDV dahil ₺274.909 |
| high | Öztiryakiler Endüstriyel Mutfak | `8823.0HA60.00` | ₺152.461 | ₺98.012 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺336.113 |
| high | Pimak | `PIMAK.21/25-30/50` | ₺122.629 | ₺68.243 | L3 oran: ödeme 100.0% (marka medyan 55.7%) — liste KDV dahil ₺122.629 |
| high | Pimak | `PIMAK.M037-4SE` | ₺122.629 | ₺68.243 | L3 oran: ödeme 100.0% (marka medyan 55.7%) — liste KDV dahil ₺122.629 |
| high | Öztiryakiler Endüstriyel Mutfak | `9805.ODB14.0A` | ₺152.221 | ₺97.858 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺335.585 |
| high | PORTABIANCO | `SBB-3N70` | ₺129.510 | ₺75.200 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺167.110 |
| high | PORTABIANCO | `TT-4D60-E` | ₺129.436 | ₺75.156 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺167.014 |
| high | Öztiryakiler Endüstriyel Mutfak | `9805.OFB10.0A` | ₺150.944 | ₺97.037 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺332.771 |
| high | PORTABIANCO | `DTT-1DGN` | ₺127.674 | ₺74.133 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺164.740 |
| high | Öztiryakiler Endüstriyel Mutfak | `9891.RFS51.8TS` | ₺149.466 | ₺96.086 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺329.509 |
| high | Öztiryakiler Endüstriyel Mutfak | `8845.0CRE6.00` | ₺148.828 | ₺95.676 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺328.102 |
| high | Öztiryakiler Endüstriyel Mutfak | `8573.CSGE4S` | ₺148.727 | ₺95.612 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺327.881 |
| high | Öztiryakiler Endüstriyel Mutfak | `8573.CSGE5S` | ₺148.727 | ₺95.612 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺327.881 |
| high | Öztiryakiler Endüstriyel Mutfak | `9563.HBH75.00` | ₺147.841 | ₺95.042 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺325.927 |
| high | PORTABIANCO | `DTT-1DGNE` | ₺125.737 | ₺73.009 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺162.241 |
| high | Öztiryakiler Endüstriyel Mutfak | `8820.UH100.MN` | ₺146.714 | ₺94.318 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺323.446 |
| high | Öztiryakiler Endüstriyel Mutfak | `8358.OKM32.SMN` | ₺145.676 | ₺93.650 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺321.156 |
| high | PORTABIANCO | `SBH-3N70E` | ₺123.686 | ₺71.818 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺159.595 |
| high | Öztiryakiler Endüstriyel Mutfak | `8890.10570.01` | ₺145.201 | ₺93.345 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺320.107 |
| high | Öztiryakiler Endüstriyel Mutfak | `8916.0MV20.00` | ₺145.201 | ₺93.345 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺320.107 |
| high | Öztiryakiler Endüstriyel Mutfak | `8916.0MV20.02` | ₺145.201 | ₺93.345 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺320.107 |
| high | Öztiryakiler Endüstriyel Mutfak | `8357.UKT01.T0` | ₺144.304 | ₺92.768 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺318.131 |
| high | Öztiryakiler Endüstriyel Mutfak | `8358.OKM32.STR` | ₺142.818 | ₺91.813 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺314.853 |
| high | PORTABIANCO | `SBM-2N70` | ₺121.558 | ₺70.583 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺156.850 |
| high | Öztiryakiler Endüstriyel Mutfak | `8820.UH100.TR` | ₺141.780 | ₺91.145 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺312.565 |
| high | Öztiryakiler Endüstriyel Mutfak | `9860.00J80.00` | ₺90.852 | ₺40.285 | L3 oran: ödeme 65.8% (marka medyan 29.2%) — liste KDV dahil ₺138.148 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.XFT04.EU` | ₺141.254 | ₺90.808 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺311.408 |
| high | Pimak | `PIMAK.MX037-4` | ₺112.948 | ₺62.856 | L3 oran: ödeme 100.0% (marka medyan 55.7%) — liste KDV dahil ₺112.948 |
| high | PORTABIANCO | `SBT-3N70` | ₺119.393 | ₺69.325 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺154.056 |
| high | Öztiryakiler Endüstriyel Mutfak | `9805.SDE84.00` | ₺139.224 | ₺89.503 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺306.932 |
| high | Öztiryakiler Endüstriyel Mutfak | `8890.ME800.01` | ₺138.978 | ₺89.344 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺306.388 |
| high | PORTABIANCO | `SBM-2N70E` | ₺117.900 | ₺68.458 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺152.129 |
| high | Öztiryakiler Endüstriyel Mutfak | `8823.0HA55.00` | ₺136.903 | ₺88.011 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺301.815 |
| high | PORTABIANCO | `SBB-3N70E` | ₺116.481 | ₺67.634 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺150.298 |
| high | PORTABIANCO | `DT-1DGN-EKO` | ₺116.444 | ₺67.613 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺150.250 |
| high | PORTABIANCO | `DT-1DGN` | ₺116.444 | ₺67.613 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺150.250 |
| high | Öztiryakiler Endüstriyel Mutfak | `8573.CDGE4S` | ₺136.282 | ₺87.611 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺300.443 |
| high | Öztiryakiler Endüstriyel Mutfak | `8573.CDGE5` | ₺136.282 | ₺87.611 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺300.443 |
| high | Öztiryakiler Endüstriyel Mutfak | `8573.CDGE6S` | ₺136.282 | ₺87.611 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺300.443 |
| high | Öztiryakiler Endüstriyel Mutfak | `8358.OKM22.SMN` | ₺135.499 | ₺87.108 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺298.720 |
| high | PORTABIANCO | `SBT-3N70E` | ₺115.100 | ₺66.832 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺148.516 |
| high | Öztiryakiler Endüstriyel Mutfak | `8845.0CRE5.00` | ₺134.844 | ₺86.686 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺297.274 |
| high | PORTABIANCO | `DT-1DGNE` | ₺114.577 | ₺66.529 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺147.841 |
| high | PORTABIANCO | `SBH-2N70` | ₺114.166 | ₺66.290 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺147.312 |
| high | PORTABIANCO | `TT-3D60` | ₺113.644 | ₺65.987 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺146.637 |
| high | PORTABIANCO | `TT-3D70` | ₺112.897 | ₺65.553 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺145.673 |
| high | PORTABIANCO | `TT-4N70` | ₺111.926 | ₺64.990 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺144.421 |
| high | Öztiryakiler Endüstriyel Mutfak | `8358.OKM22.STR` | ₺131.154 | ₺84.315 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺289.141 |
| high | PORTABIANCO | `TT-4N60` | ₺110.022 | ₺63.884 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺141.964 |
| high | Öztiryakiler Endüstriyel Mutfak | `8845.0CRG4.00` | ₺128.606 | ₺82.677 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺283.524 |
| high | Öztiryakiler Endüstriyel Mutfak | `8880.00120.02` | ₺127.570 | ₺82.010 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺281.237 |
| high | Öztiryakiler Endüstriyel Mutfak | `9805.0B140.SA` | ₺110.994 | ₺65.585 | L3 oran: ödeme 49.4% (marka medyan 29.2%) — liste KDV dahil ₺224.912 |
| high | Öztiryakiler Endüstriyel Mutfak | `9805.OKB88.A0` | ₺126.460 | ₺81.297 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺278.791 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.XBC12.EU` | ₺125.814 | ₺80.882 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺277.368 |
| high | Öztiryakiler Endüstriyel Mutfak | `8477.SLUSH.24I` | ₺124.894 | ₺80.290 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺275.338 |
| high | PORTABIANCO | `SBB-2N70` | ₺105.542 | ₺61.283 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺136.184 |
| high | PORTABIANCO | `SBT-2N70` | ₺103.228 | ₺59.939 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺133.197 |
| high | Öztiryakiler Endüstriyel Mutfak | `9840.R301C.00` | ₺77.287 | ₺34.270 | L3 oran: ödeme 65.8% (marka medyan 29.2%) — liste KDV dahil ₺117.522 |
| high | Öztiryakiler Endüstriyel Mutfak | `9805.OKB68.A0` | ₺120.164 | ₺77.249 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺264.912 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.XBC08.EU` | ₺120.095 | ₺77.205 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺264.760 |
| high | PORTABIANCO | `TT-3D70-E` | ₺101.809 | ₺59.115 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺131.366 |
| high | Öztiryakiler Endüstriyel Mutfak | `8860.OPS01.28` | ₺119.273 | ₺76.676 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺262.945 |
| high | Öztiryakiler Endüstriyel Mutfak | `9580.K95L0.00` | ₺118.945 | ₺76.466 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺262.226 |
| high | PORTABIANCO | `DTT-1NGN` | ₺100.977 | ₺58.632 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺130.293 |
| high | PORTABIANCO | `SBH-2N70E` | ₺100.390 | ₺58.291 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺129.536 |
| high | PORTABIANCO | `SBB-2N70E` | ₺100.241 | ₺58.205 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺129.343 |
| high | Öztiryakiler Endüstriyel Mutfak | `8573.CDE4S` | ₺117.613 | ₺75.609 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺259.287 |
| high | PORTABIANCO | `DTT-1NGNE` | ₺100.096 | ₺58.120 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺129.156 |
| high | Öztiryakiler Endüstriyel Mutfak | `8890.P9292.02` | ₺116.492 | ₺74.889 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺256.817 |
| high | PORTABIANCO | `SBT-2N70E` | ₺98.636 | ₺57.272 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺127.272 |
| high | PORTABIANCO | `TT-3D60-E` | ₺97.814 | ₺56.795 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺126.212 |
| high | Öztiryakiler Endüstriyel Mutfak | `9805.SDE64.00` | ₺114.797 | ₺73.799 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺253.080 |
| high | PORTABIANCO | `TT-2D70` | ₺97.665 | ₺56.709 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺126.019 |
| high | PORTABIANCO | `DT-1NGN-EKO` | ₺96.545 | ₺56.058 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺124.574 |
| high | PORTABIANCO | `DT-1NGN` | ₺96.545 | ₺56.058 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺124.574 |
| high | Pimak | `PIMAK.MX037-3` | ₺90.358 | ₺50.285 | L3 oran: ödeme 100.0% (marka medyan 55.7%) — liste KDV dahil ₺90.358 |
| high | Pimak | `PIMAK.PVK100` | ₺90.358 | ₺50.285 | L3 oran: ödeme 100.0% (marka medyan 55.7%) — liste KDV dahil ₺90.358 |
| high | Öztiryakiler Endüstriyel Mutfak | `9810.MP800.UL` | ₺71.988 | ₺31.920 | L3 oran: ödeme 65.8% (marka medyan 29.2%) — liste KDV dahil ₺109.463 |
| high | PORTABIANCO | `DT-1NGNE` | ₺94.566 | ₺54.909 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺122.021 |
| high | PORTABIANCO | `TT-4N70-E` | ₺93.820 | ₺54.476 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺121.057 |
| high | Öztiryakiler Endüstriyel Mutfak | `9830.RL300.RD` | ₺109.459 | ₺70.367 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺241.312 |
| high | Öztiryakiler Endüstriyel Mutfak | `8358.OKM32.MN` | ₺109.315 | ₺70.274 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺240.993 |
| high | PORTABIANCO | `TT-3N70` | ₺92.774 | ₺53.869 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺119.709 |
| high | Öztiryakiler Endüstriyel Mutfak | `8845.0CRG3.00` | ₺108.907 | ₺70.013 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺240.096 |
| high | Öztiryakiler Endüstriyel Mutfak | `8845.0CRE4.00` | ₺108.907 | ₺70.013 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺240.096 |
| high | PORTABIANCO | `TT-3N60` | ₺90.795 | ₺52.720 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺117.155 |
| high | Öztiryakiler Endüstriyel Mutfak | `8820.UHM50.MN` | ₺105.827 | ₺68.033 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺233.305 |
| high | PORTABIANCO | `TT-2D60` | ₺89.937 | ₺52.221 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺116.047 |
| high | Öztiryakiler Endüstriyel Mutfak | `8358.OKM32.TR` | ₺104.969 | ₺67.481 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺231.413 |
| high | Öztiryakiler Endüstriyel Mutfak | `9885.XEBHC.HCEU` | ₺104.654 | ₺67.279 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺230.719 |
| high | Pimak | `PIMAK.PVK80` | ₺83.904 | ₺46.693 | L3 oran: ödeme 100.0% (marka medyan 55.7%) — liste KDV dahil ₺83.904 |
| high | PORTABIANCO | `TT-4N60-E` | ₺87.846 | ₺51.007 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺113.350 |
| high | Öztiryakiler Endüstriyel Mutfak | `9823.00022.00` | ₺101.394 | ₺65.183 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺223.531 |
| high | Öztiryakiler Endüstriyel Mutfak | `8477.KAM40.00` | ₺101.371 | ₺65.168 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺223.481 |
| high | Öztiryakiler Endüstriyel Mutfak | `9860.000R2.00` | ₺64.703 | ₺28.690 | L3 oran: ödeme 65.8% (marka medyan 29.2%) — liste KDV dahil ₺98.386 |
| high | Öztiryakiler Endüstriyel Mutfak | `9860.MP600.A0` | ₺64.479 | ₺28.591 | L3 oran: ödeme 65.8% (marka medyan 29.2%) — liste KDV dahil ₺98.047 |
| high | Öztiryakiler Endüstriyel Mutfak | `8573.CDE2S` | ₺98.944 | ₺63.608 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺218.130 |
| high | Öztiryakiler Endüstriyel Mutfak | `8573.CDGE3S` | ₺98.944 | ₺63.608 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺218.130 |
| high | Öztiryakiler Endüstriyel Mutfak | `8890.10570.00` | ₺98.530 | ₺63.341 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺217.216 |
| high | Öztiryakiler Endüstriyel Mutfak | `8820.UHM50.TR` | ₺97.810 | ₺62.879 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺215.631 |
| high | Öztiryakiler Endüstriyel Mutfak | `9840.R201E.00` | ₺62.713 | ₺27.808 | L3 oran: ödeme 65.8% (marka medyan 29.2%) — liste KDV dahil ₺95.361 |
| high | Öztiryakiler Endüstriyel Mutfak | `8845.0CRE3.00` | ₺96.984 | ₺62.348 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺213.810 |
| high | Öztiryakiler Endüstriyel Mutfak | `9805.SDE50.00` | ₺96.984 | ₺62.348 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺213.810 |
| high | Pimak | `PIMAK.MX037-2` | ₺77.450 | ₺43.101 | L3 oran: ödeme 100.0% (marka medyan 55.7%) — liste KDV dahil ₺77.450 |
| high | Pimak | `PIMAK.PVK60` | ₺77.450 | ₺43.101 | L3 oran: ödeme 100.0% (marka medyan 55.7%) — liste KDV dahil ₺77.450 |
| high | Öztiryakiler Endüstriyel Mutfak | `8358.OKM22.MN` | ₺96.164 | ₺61.821 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺212.003 |
| high | Öztiryakiler Endüstriyel Mutfak | `8358.OKM22.TR` | ₺96.164 | ₺61.821 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺212.003 |
| high | Öztiryakiler Endüstriyel Mutfak | `9885.EECHC.00` | ₺94.933 | ₺61.029 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺209.286 |
| high | PORTABIANCO | `TT-2D60-E` | ₺80.491 | ₺46.737 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺103.860 |
| high | Öztiryakiler Endüstriyel Mutfak | `8880.0EMMK.A0` | ₺94.381 | ₺60.674 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺208.070 |
| high | PORTABIANCO | `TT-2N70` | ₺80.379 | ₺46.672 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺103.715 |
| high | PORTABIANCO | `TT-2D70-E` | ₺79.185 | ₺45.978 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺102.174 |
| high | Öztiryakiler Endüstriyel Mutfak | `8573.ESE3R.00` | ₺92.722 | ₺59.607 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺204.411 |
| high | Öztiryakiler Endüstriyel Mutfak | `8845.0CRG2.00` | ₺91.792 | ₺59.009 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺202.361 |
| high | Öztiryakiler Endüstriyel Mutfak | `9563.HBH65.00` | ₺91.182 | ₺58.618 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺201.018 |
| high | Öztiryakiler Endüstriyel Mutfak | `8890.P9262.02` | ₺90.605 | ₺58.247 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺199.747 |
| high | Öztiryakiler Endüstriyel Mutfak | `9805.SDE40.00` | ₺89.674 | ₺57.648 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺197.693 |
| high | PORTABIANCO | `TT-2N60` | ₺76.198 | ₺44.244 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺98.320 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.XBC16.EU` | ₺89.213 | ₺57.352 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺196.679 |
| high | PORTABIANCO | `TT-3N70-E` | ₺75.190 | ₺43.659 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺97.019 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.XFT04.HS` | ₺86.927 | ₺55.882 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺191.636 |
| high | Öztiryakiler Endüstriyel Mutfak | `9350.SEG18.00T` | ₺84.973 | ₺54.627 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺187.331 |
| high | Öztiryakiler Endüstriyel Mutfak | `8477.SLUSH.12I` | ₺83.449 | ₺53.646 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺183.970 |
| high | PORTABIANCO | `TT-3N60-E` | ₺70.897 | ₺41.166 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺91.479 |
| high | Öztiryakiler Endüstriyel Mutfak | `8959.180PM.168` | ₺82.478 | ₺53.023 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺181.831 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.XEKPT1.0EUC` | ₺82.351 | ₺52.941 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺181.550 |
| high | Öztiryakiler Endüstriyel Mutfak | `9805.OKB46.A0` | ₺81.841 | ₺52.612 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺180.424 |
| high | Öztiryakiler Endüstriyel Mutfak | `9860.MP450.C0` | ₺52.114 | ₺23.108 | L3 oran: ödeme 65.8% (marka medyan 29.2%) — liste KDV dahil ₺79.243 |
| high | Öztiryakiler Endüstriyel Mutfak | `8573.CDE3S` | ₺80.275 | ₺51.606 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺176.974 |
| high | Öztiryakiler Endüstriyel Mutfak | `9860.MP550.A0` | ₺51.453 | ₺22.815 | L3 oran: ödeme 65.8% (marka medyan 29.2%) — liste KDV dahil ₺78.239 |
| high | Pimak | `PIMAK.MX037-1` | ₺64.542 | ₺35.918 | L3 oran: ödeme 100.0% (marka medyan 55.7%) — liste KDV dahil ₺64.542 |
| high | Öztiryakiler Endüstriyel Mutfak | `8845.0CRE2.00` | ₺79.867 | ₺51.344 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺176.075 |
| high | Öztiryakiler Endüstriyel Mutfak | `9805.OKB37.A0` | ₺78.445 | ₺50.430 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺172.941 |
| high | Öztiryakiler Endüstriyel Mutfak | `8477.KAM22.00` | ₺77.288 | ₺49.686 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺170.388 |
| high | Öztiryakiler Endüstriyel Mutfak | `8477.00M40.00` | ₺76.169 | ₺48.966 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺167.919 |
| high | Öztiryakiler Endüstriyel Mutfak | `8477.00SSS.03` | ₺76.169 | ₺48.966 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺167.919 |
| high | Öztiryakiler Endüstriyel Mutfak | `8477.00SSA.03` | ₺76.169 | ₺48.966 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺167.919 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.XEKPT.8EUC` | ₺75.488 | ₺48.529 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺166.421 |
| high | Öztiryakiler Endüstriyel Mutfak | `9810.MP350.CU` | ₺48.139 | ₺21.345 | L3 oran: ödeme 65.8% (marka medyan 29.2%) — liste KDV dahil ₺73.199 |
| high | Öztiryakiler Endüstriyel Mutfak | `8894.PREMI.00` | ₺74.675 | ₺48.006 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺164.627 |
| high | Öztiryakiler Endüstriyel Mutfak | `8890.P9292.01` | ₺74.426 | ₺47.846 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺164.078 |
| high | PORTABIANCO | `TT-2N70-E` | ₺63.206 | ₺36.700 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺81.556 |
| high | Öztiryakiler Endüstriyel Mutfak | `8573.ESE2S` | ₺74.052 | ₺47.606 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺163.255 |
| high | Öztiryakiler Endüstriyel Mutfak | `8573.ESE3S` | ₺74.052 | ₺47.606 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺163.255 |
| high | Öztiryakiler Endüstriyel Mutfak | `8820.UHM35.MN` | ₺73.693 | ₺47.375 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺162.465 |
| high | PORTABIANCO | `TT-2N60-E` | ₺62.347 | ₺36.202 | L3 oran: ödeme 77.5% (marka medyan 45.0%) — liste KDV dahil ₺80.448 |
| high | Öztiryakiler Endüstriyel Mutfak | `9805.SDE30.00` | ₺71.976 | ₺46.271 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺158.679 |
| high | Öztiryakiler Endüstriyel Mutfak | `9868.FG10I.DGT` | ₺71.802 | ₺46.159 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺158.295 |
| high | Öztiryakiler Endüstriyel Mutfak | `7506.0B390.00` | ₺71.716 | ₺46.103 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺158.103 |
| high | Öztiryakiler Endüstriyel Mutfak | `9830.RL250.RD` | ₺71.192 | ₺45.768 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺156.952 |
| high | Öztiryakiler Endüstriyel Mutfak | `9535.00053.00` | ₺69.830 | ₺44.891 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺153.946 |
| high | Öztiryakiler Endüstriyel Mutfak | `8820.UHM35.TR` | ₺69.432 | ₺44.635 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺153.068 |
| high | Öztiryakiler Endüstriyel Mutfak | `8840.USD02.00` | ₺69.095 | ₺44.419 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺152.326 |
| high | Öztiryakiler Endüstriyel Mutfak | `9830.RL220.RD` | ₺68.554 | ₺44.071 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺151.132 |
| high | Öztiryakiler Endüstriyel Mutfak | `8959.170PM.120` | ₺68.089 | ₺43.772 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺150.108 |
| high | Öztiryakiler Endüstriyel Mutfak | `9450.RT90S.LM` | ₺67.828 | ₺43.604 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺149.533 |
| high | Öztiryakiler Endüstriyel Mutfak | `9450.GW411.BGL` | ₺67.770 | ₺43.567 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺149.405 |
| high | Öztiryakiler Endüstriyel Mutfak | `8823.0HA40.00` | ₺66.584 | ₺42.805 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺146.792 |
| high | Öztiryakiler Endüstriyel Mutfak | `8820.UHM25.MN` | ₺66.403 | ₺42.688 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺146.391 |
| high | Öztiryakiler Endüstriyel Mutfak | `9830.0XS25.00` | ₺65.914 | ₺42.373 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺145.311 |
| high | Öztiryakiler Endüstriyel Mutfak | `8959.135PM.84` | ₺65.130 | ₺41.870 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺143.585 |
| high | Öztiryakiler Endüstriyel Mutfak | `8959.125PM.84` | ₺64.463 | ₺41.441 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺142.114 |
| high | Öztiryakiler Endüstriyel Mutfak | `8890.P6262.02` | ₺64.072 | ₺41.189 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺141.250 |
| high | Öztiryakiler Endüstriyel Mutfak | `9805.OKB25.A0` | ₺63.824 | ₺41.031 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺140.706 |
| high | Öztiryakiler Endüstriyel Mutfak | `9805.SDE24.00` | ₺63.564 | ₺40.863 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺140.131 |
| high | Öztiryakiler Endüstriyel Mutfak | `8820.UHM25.TR` | ₺63.038 | ₺40.525 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺138.973 |
| high | Öztiryakiler Endüstriyel Mutfak | `8358.OKM12.MN` | ₺62.994 | ₺40.496 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺138.875 |
| high | Öztiryakiler Endüstriyel Mutfak | `8820.UHM15.MN` | ₺61.692 | ₺39.660 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺136.006 |
| high | Öztiryakiler Endüstriyel Mutfak | `8573.EDE2S` | ₺61.607 | ₺39.605 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺135.817 |
| high | Öztiryakiler Endüstriyel Mutfak | `8573.EDE3S` | ₺61.607 | ₺39.605 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺135.817 |
| high | Öztiryakiler Endüstriyel Mutfak | `8959.160PM.96` | ₺61.561 | ₺39.576 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺135.718 |
| high | Öztiryakiler Endüstriyel Mutfak | `8840.USD01.00` | ₺61.132 | ₺39.299 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺134.769 |
| high | Öztiryakiler Endüstriyel Mutfak | `9860.MP250.C0` | ₺39.087 | ₺17.332 | L3 oran: ödeme 65.8% (marka medyan 29.2%) — liste KDV dahil ₺59.436 |
| high | Öztiryakiler Endüstriyel Mutfak | `8890.P9262.01` | ₺59.326 | ₺38.138 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺130.787 |
| high | Öztiryakiler Endüstriyel Mutfak | `9868.RTR16.0L` | ₺52.780 | ₺31.668 | L3 oran: ödeme 48.6% (marka medyan 29.2%) — liste KDV dahil ₺108.600 |
| high | Öztiryakiler Endüstriyel Mutfak | `8820.UHM15.TR` | ₺58.776 | ₺37.785 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺129.576 |
| high | Öztiryakiler Endüstriyel Mutfak | `8823.0HA30.00` | ₺58.184 | ₺37.405 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺128.272 |
| high | Öztiryakiler Endüstriyel Mutfak | `9450.GW460.BGL` | ₺57.006 | ₺36.648 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺125.676 |
| high | Öztiryakiler Endüstriyel Mutfak | `9450.GW432.BGL` | ₺56.950 | ₺36.610 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺125.549 |
| high | Öztiryakiler Endüstriyel Mutfak | `9805.OKB22.A0` | ₺56.862 | ₺36.555 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺125.357 |
| high | Öztiryakiler Endüstriyel Mutfak | `9805.SDE18.00` | ₺55.933 | ₺35.958 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺123.310 |
| high | Öztiryakiler Endüstriyel Mutfak | `9450.SQ60S.LM` | ₺54.918 | ₺35.305 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺121.072 |
| high | Öztiryakiler Endüstriyel Mutfak | `9868.0FG10.DGT` | ₺54.860 | ₺35.268 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺120.944 |
| high | Öztiryakiler Endüstriyel Mutfak | `9479.GWM10.11AGL` | ₺54.656 | ₺35.137 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺120.496 |
| high | Öztiryakiler Endüstriyel Mutfak | `8477.000SS.02` | ₺54.326 | ₺34.924 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺119.766 |
| high | Öztiryakiler Endüstriyel Mutfak | `8477.000AA.02` | ₺54.326 | ₺34.924 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺119.766 |
| high | Öztiryakiler Endüstriyel Mutfak | `8477.000SA.02` | ₺54.326 | ₺34.924 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺119.766 |
| high | Öztiryakiler Endüstriyel Mutfak | `9580.OSCAR.10` | ₺53.960 | ₺34.690 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺118.961 |
| high | Öztiryakiler Endüstriyel Mutfak | `8477.00M22.00` | ₺53.766 | ₺34.564 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺118.531 |
| high | Öztiryakiler Endüstriyel Mutfak | `9810.MP450.UL` | ₺34.448 | ₺15.275 | L3 oran: ödeme 65.8% (marka medyan 29.2%) — liste KDV dahil ₺52.381 |
| high | Öztiryakiler Endüstriyel Mutfak | `9868.RTR12.0L` | ₺47.713 | ₺28.628 | L3 oran: ödeme 48.6% (marka medyan 29.2%) — liste KDV dahil ₺98.175 |
| high | Öztiryakiler Endüstriyel Mutfak | `9563.HMD20.00` | ₺52.888 | ₺33.999 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺116.594 |
| high | Öztiryakiler Endüstriyel Mutfak | `9450.GW440.BGL` | ₺52.307 | ₺33.626 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺115.315 |
| high | Öztiryakiler Endüstriyel Mutfak | `9450.GW421.BGL` | ₺52.278 | ₺33.608 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺115.251 |
| high | Öztiryakiler Endüstriyel Mutfak | `8959.145PM.60` | ₺51.698 | ₺33.235 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺113.972 |
| high | Öztiryakiler Endüstriyel Mutfak | `9563.HBH45.00` | ₺50.972 | ₺32.769 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺112.373 |
| high | Öztiryakiler Endüstriyel Mutfak | `9868.FG10I.00` | ₺50.770 | ₺32.638 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺111.926 |
| high | Öztiryakiler Endüstriyel Mutfak | `9584.00MDX.00` | ₺50.131 | ₺32.228 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺110.519 |
| high | Öztiryakiler Endüstriyel Mutfak | `9830.F300E.00` | ₺49.697 | ₺31.948 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺109.559 |
| high | Öztiryakiler Endüstriyel Mutfak | `8890.P5050.02` | ₺48.539 | ₺31.204 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺107.007 |
| high | Öztiryakiler Endüstriyel Mutfak | `9810.MP350.U0` | ₺31.138 | ₺13.807 | L3 oran: ödeme 65.8% (marka medyan 29.2%) — liste KDV dahil ₺47.348 |
| high | Öztiryakiler Endüstriyel Mutfak | `8325.B5300.7080P` | ₺45.896 | ₺29.505 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺101.181 |
| high | Öztiryakiler Endüstriyel Mutfak | `9860.MP190.C0` | ₺29.371 | ₺13.023 | L3 oran: ödeme 65.8% (marka medyan 29.2%) — liste KDV dahil ₺44.662 |
| high | Öztiryakiler Endüstriyel Mutfak | `8959.155PM.48` | ₺45.518 | ₺29.262 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺100.349 |
| high | Öztiryakiler Endüstriyel Mutfak | `8820.UHM10.MN` | ₺43.969 | ₺28.267 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺96.935 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.XF023.00` | ₺42.892 | ₺27.573 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺94.557 |
| high | Öztiryakiler Endüstriyel Mutfak | `9891.RMS51.0TS` | ₺42.647 | ₺27.416 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺94.017 |
| high | Öztiryakiler Endüstriyel Mutfak | `8760.0CCGT.15` | ₺42.523 | ₺27.337 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺93.746 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.24DP4.07` | ₺41.861 | ₺26.911 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺92.287 |
| high | Öztiryakiler Endüstriyel Mutfak | `8820.UHM10.TR` | ₺41.053 | ₺26.392 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺90.506 |
| high | Öztiryakiler Endüstriyel Mutfak | `8880.OS050.00` | ₺40.864 | ₺26.270 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺90.087 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.32DP4.07` | ₺40.842 | ₺26.256 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺90.039 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.31DP4.07` | ₺39.881 | ₺25.638 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺87.920 |
| high | Öztiryakiler Endüstriyel Mutfak | `9450.50050.70` | ₺39.686 | ₺25.514 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺87.494 |
| high | Öztiryakiler Endüstriyel Mutfak | `8224.BC23L.00` | ₺39.205 | ₺25.203 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺86.429 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.16DP4.07` | ₺39.122 | ₺25.151 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺86.250 |
| high | Öztiryakiler Endüstriyel Mutfak | `8959.0TAA6.00` | ₺38.270 | ₺24.603 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺84.371 |
| high | Öztiryakiler Endüstriyel Mutfak | `9868.ET700.A0` | ₺38.092 | ₺24.488 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺83.976 |
| high | Öztiryakiler Endüstriyel Mutfak | `8999.00926.00` | ₺37.830 | ₺24.320 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺83.401 |
| high | Öztiryakiler Endüstriyel Mutfak | `8477.0000S.01` | ₺37.524 | ₺24.123 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺82.725 |
| high | Öztiryakiler Endüstriyel Mutfak | `8477.0000A.01` | ₺37.524 | ₺24.123 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺82.725 |
| high | Öztiryakiler Endüstriyel Mutfak | `8890.P6262.01` | ₺37.213 | ₺23.923 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺82.039 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.XF003.00` | ₺37.172 | ₺23.897 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺81.950 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.30DP4.07` | ₺37.142 | ₺23.877 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺81.883 |
| high | Öztiryakiler Endüstriyel Mutfak | `8760.0CCGT.10` | ₺37.026 | ₺23.803 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺81.627 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.23DP4.07` | ₺36.908 | ₺23.728 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺81.369 |
| high | Öztiryakiler Endüstriyel Mutfak | `8325.B5150.5060P` | ₺36.293 | ₺23.331 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺80.011 |
| high | Öztiryakiler Endüstriyel Mutfak | `8850.02K40.02R` | ₺32.233 | ₺19.340 | L3 oran: ödeme 48.6% (marka medyan 29.2%) — liste KDV dahil ₺66.324 |
| high | Öztiryakiler Endüstriyel Mutfak | `8999.00927.00` | ₺35.510 | ₺22.828 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺78.284 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.24IP4.073` | ₺35.424 | ₺22.772 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺78.094 |
| high | Öztiryakiler Endüstriyel Mutfak | `9830.F250E.00` | ₺35.306 | ₺22.697 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺77.836 |
| high | Öztiryakiler Endüstriyel Mutfak | `9830.F275E.00` | ₺35.306 | ₺22.697 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺77.836 |
| high | Öztiryakiler Endüstriyel Mutfak | `9563.HBB25.S0` | ₺35.104 | ₺22.567 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺77.389 |
| high | Öztiryakiler Endüstriyel Mutfak | `9810.EF705.H0` | ₺34.813 | ₺22.380 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺76.749 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.22DP4.07` | ₺34.433 | ₺22.136 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺75.910 |
| high | Öztiryakiler Endüstriyel Mutfak | `9860.MP240.VV` | ₺22.082 | ₺9.791 | L3 oran: ödeme 65.8% (marka medyan 29.2%) — liste KDV dahil ₺33.578 |
| high | Öztiryakiler Endüstriyel Mutfak | `9853.60165.00` | ₺30.462 | ₺18.277 | L3 oran: ödeme 48.6% (marka medyan 29.2%) — liste KDV dahil ₺62.678 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.29DP4.07` | ₺33.937 | ₺21.817 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺74.818 |
| high | Öztiryakiler Endüstriyel Mutfak | `8959.BK125.00` | ₺33.836 | ₺21.753 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺74.596 |
| high | Öztiryakiler Endüstriyel Mutfak | `8890.P5050.01` | ₺33.438 | ₺21.496 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺73.716 |
| high | Öztiryakiler Endüstriyel Mutfak | `8999.00928.00` | ₺33.391 | ₺21.466 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺73.615 |
| high | Öztiryakiler Endüstriyel Mutfak | `8850.WKM25.02` | ₺33.188 | ₺21.336 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺73.167 |
| high | Öztiryakiler Endüstriyel Mutfak | `8850.0WM25.02` | ₺33.188 | ₺21.336 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺73.167 |
| high | Öztiryakiler Endüstriyel Mutfak | `8850.WF25E.02` | ₺33.188 | ₺21.336 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺73.167 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.32IP4.073` | ₺33.064 | ₺21.256 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺72.892 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.31IP4.073` | ₺32.947 | ₺21.181 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺72.635 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.14DP4.07` | ₺32.190 | ₺20.694 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺70.965 |
| high | Öztiryakiler Endüstriyel Mutfak | `8760.0CCGT.06` | ₺32.152 | ₺20.669 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺70.881 |
| high | Öztiryakiler Endüstriyel Mutfak | `9860.MP190.VV` | ₺20.315 | ₺9.008 | L3 oran: ödeme 65.8% (marka medyan 29.2%) — liste KDV dahil ₺30.891 |
| high | Öztiryakiler Endüstriyel Mutfak | `9991.SV320.00` | ₺31.622 | ₺20.329 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺69.714 |
| high | Öztiryakiler Endüstriyel Mutfak | `9563.HBB25.00` | ₺31.565 | ₺20.291 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺69.586 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.21DP4.07` | ₺31.200 | ₺20.057 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺68.782 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.28DP4.07` | ₺31.200 | ₺20.057 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺68.782 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.23IP4.073` | ₺30.472 | ₺19.589 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺67.176 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.30IP4.073` | ₺30.472 | ₺19.589 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺67.176 |
| high | Öztiryakiler Endüstriyel Mutfak | `8895.TTA37.53` | ₺30.337 | ₺19.502 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺66.880 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.16IP4.073` | ₺30.209 | ₺19.420 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺66.598 |
| high | Öztiryakiler Endüstriyel Mutfak | `9450.5681A.00` | ₺29.765 | ₺19.135 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺65.620 |
| high | Öztiryakiler Endüstriyel Mutfak | `9860.00011.00` | ₺29.650 | ₺19.061 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺65.365 |
| high | Öztiryakiler Endüstriyel Mutfak | `9830.S220A.F0` | ₺29.243 | ₺18.799 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺64.469 |
| high | Öztiryakiler Endüstriyel Mutfak | `8999.00929.00` | ₺29.040 | ₺18.669 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺64.021 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.22IP4.073` | ₺28.490 | ₺18.315 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺62.809 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.29IP4.073` | ₺28.490 | ₺18.315 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺62.809 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.15IP4.073` | ₺27.499 | ₺17.679 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺60.625 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.24IP4.07` | ₺27.005 | ₺17.360 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺59.534 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.21IP4.073` | ₺27.005 | ₺17.360 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺59.534 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.13DP4.07` | ₺26.014 | ₺16.724 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺57.350 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.20DP4.07` | ₺26.014 | ₺16.724 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺57.350 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.28IP4.073` | ₺25.752 | ₺16.555 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺56.772 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.27DP4.07` | ₺25.752 | ₺16.555 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺56.772 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.14IP4.073` | ₺25.518 | ₺16.405 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺56.258 |
| high | Öztiryakiler Endüstriyel Mutfak | `9450.RO60G.LMWCRG` | ₺25.414 | ₺16.338 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺56.027 |
| high | Öztiryakiler Endüstriyel Mutfak | `9860.MP160.VV` | ₺16.122 | ₺7.149 | L3 oran: ödeme 65.8% (marka medyan 29.2%) — liste KDV dahil ₺24.515 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.31IP4.07` | ₺25.024 | ₺16.087 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺55.167 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.32IP4.07` | ₺24.848 | ₺15.974 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺54.781 |
| high | Öztiryakiler Endüstriyel Mutfak | `8864.07050.02` | ₺24.746 | ₺15.909 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺54.556 |
| high | Öztiryakiler Endüstriyel Mutfak | `9450.5682A.00` | ₺24.409 | ₺15.692 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺53.811 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.27IP4.073` | ₺24.266 | ₺15.600 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺53.497 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.12DP4.07` | ₺24.034 | ₺15.450 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺52.983 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.56171.P0` | ₺24.018 | ₺15.440 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺52.950 |
| high | Öztiryakiler Endüstriyel Mutfak | `8760.01001.0A` | ₺23.855 | ₺15.335 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺52.589 |
| high | Öztiryakiler Endüstriyel Mutfak | `9810.EF708.B0` | ₺23.789 | ₺15.293 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺52.445 |
| high | Öztiryakiler Endüstriyel Mutfak | `9810.EF708.G0` | ₺23.789 | ₺15.293 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺52.445 |
| high | Öztiryakiler Endüstriyel Mutfak | `9810.EF708.S0` | ₺23.789 | ₺15.293 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺52.445 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.16IP4.07` | ₺23.276 | ₺14.963 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺51.313 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.23IP4.07` | ₺23.276 | ₺14.963 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺51.313 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.30IP4.07` | ₺23.276 | ₺14.963 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺51.313 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.13IP4.073` | ₺23.042 | ₺14.813 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺50.799 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.20IP4.073` | ₺23.042 | ₺14.813 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺50.799 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.56161.P0` | ₺22.964 | ₺14.763 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺50.625 |
| high | Öztiryakiler Endüstriyel Mutfak | `9865.APF35.00` | ₺22.657 | ₺14.566 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺49.951 |
| high | PORTABIANCO | `251.1280DK` | ₺19.401 | ₺11.340 | L3 oran: ödeme 77.0% (marka medyan 45.0%) — liste KDV dahil ₺25.199 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.56151.P0` | ₺22.319 | ₺14.348 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺49.205 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.12IP4.073` | ₺22.052 | ₺14.177 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺48.616 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.46171.P0` | ₺22.027 | ₺14.160 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺48.559 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.22IP4.07` | ₺21.790 | ₺14.008 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺48.038 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.29IP4.07` | ₺21.790 | ₺14.008 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺48.038 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.19IP4.073` | ₺21.557 | ₺13.858 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺47.524 |
| high | Öztiryakiler Endüstriyel Mutfak | `9450.RO60G.LMWC` | ₺21.554 | ₺13.857 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺47.520 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.36171.P0` | ₺21.382 | ₺13.746 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺47.138 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.56141.P0` | ₺21.382 | ₺13.746 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺47.138 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.46161.P0` | ₺21.323 | ₺13.708 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺47.009 |
| high | Öztiryakiler Endüstriyel Mutfak | `9865.BT350.KCT1` | ₺21.294 | ₺13.689 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺46.945 |
| high | Öztiryakiler Endüstriyel Mutfak | `9890.D90D2.30` | ₺21.149 | ₺13.596 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺46.625 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.15IP4.07` | ₺21.061 | ₺13.540 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺46.432 |
| high | Öztiryakiler Endüstriyel Mutfak | `9868.BT350.KCT` | ₺21.034 | ₺13.521 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺46.369 |
| high | Öztiryakiler Endüstriyel Mutfak | `9868.BT350.T0` | ₺21.034 | ₺13.521 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺46.369 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.21IP4.07` | ₺20.567 | ₺13.222 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺45.341 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.36161.P0` | ₺20.562 | ₺13.219 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺45.330 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.46151.P0` | ₺20.562 | ₺13.219 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺45.330 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.11IP4.073` | ₺20.304 | ₺13.053 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺44.763 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.5612P.00` | ₺20.152 | ₺12.955 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺44.426 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.36151.P0` | ₺19.918 | ₺12.804 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺43.910 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.14IP4.07` | ₺19.810 | ₺12.735 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺43.671 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.28IP4.07` | ₺19.810 | ₺12.735 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺43.671 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.46141.P0` | ₺19.741 | ₺12.691 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺43.522 |
| high | PORTABIANCO | `251.1280K` | ₺16.894 | ₺9.874 | L3 oran: ödeme 77.0% (marka medyan 45.0%) — liste KDV dahil ₺21.942 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.5611P.00` | ₺19.332 | ₺12.428 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺42.618 |
| high | Öztiryakiler Endüstriyel Mutfak | `9805.00IMD.00` | ₺16.835 | ₺9.948 | L3 oran: ödeme 49.3% (marka medyan 29.2%) — liste KDV dahil ₺34.114 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.36141.P0` | ₺19.038 | ₺12.239 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺41.972 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.46130.P0` | ₺18.863 | ₺12.126 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺41.585 |
| high | Öztiryakiler Endüstriyel Mutfak | `9563.HBB90.80` | ₺18.683 | ₺12.011 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺41.189 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.56110.P0` | ₺18.511 | ₺11.900 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺40.810 |
| high | Öztiryakiler Endüstriyel Mutfak | `9563.CB699.0D` | ₺18.277 | ₺11.750 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺40.293 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.36130.P0` | ₺18.102 | ₺11.637 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺39.906 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.27IP4.07` | ₺18.091 | ₺11.630 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺39.882 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.46120.P0` | ₺18.042 | ₺11.599 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺39.777 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.20IP4.07` | ₺17.828 | ₺11.461 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺39.304 |
| high | Öztiryakiler Endüstriyel Mutfak | `8850.WKM25.00` | ₺17.632 | ₺11.335 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺38.870 |
| high | Öztiryakiler Endüstriyel Mutfak | `8850.WF25E.00` | ₺17.632 | ₺11.335 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺38.870 |
| high | Öztiryakiler Endüstriyel Mutfak | `8830.30610.00` | ₺17.632 | ₺11.335 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺38.870 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.13IP4.07` | ₺17.594 | ₺11.311 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺38.790 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.36120.P0` | ₺17.574 | ₺11.298 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺38.744 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.56100.P0` | ₺17.574 | ₺11.298 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺38.744 |
| high | Öztiryakiler Endüstriyel Mutfak | `8850.0WM25.00` | ₺17.268 | ₺11.101 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺38.070 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.46110.5P` | ₺17.222 | ₺11.072 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺37.969 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.12IP4.07` | ₺16.837 | ₺10.824 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺37.120 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.19IP4.07` | ₺16.837 | ₺10.824 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺37.120 |
| high | Öztiryakiler Endüstriyel Mutfak | `9479.10061.HK` | ₺16.710 | ₺10.743 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺36.840 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.36110.P0` | ₺16.637 | ₺10.695 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺36.677 |
| high | Öztiryakiler Endüstriyel Mutfak | `9584.AMM50.12` | ₺16.450 | ₺10.575 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺36.264 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.5689P.00` | ₺16.403 | ₺10.545 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺36.161 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.46100.P0` | ₺16.344 | ₺10.507 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺36.032 |
| high | Öztiryakiler Endüstriyel Mutfak | `9868.11986.6001` | ₺16.159 | ₺10.388 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺35.624 |
| high | Öztiryakiler Endüstriyel Mutfak | `9868.11986.6001` | ₺16.159 | ₺10.388 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺35.624 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.36100.P0` | ₺15.992 | ₺10.281 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺35.257 |
| high | Öztiryakiler Endüstriyel Mutfak | `7959.60578.40` | ₺15.972 | ₺10.268 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺35.212 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.11IP4.07` | ₺15.847 | ₺10.188 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺34.937 |
| high | Öztiryakiler Endüstriyel Mutfak | `8574.CM400.00` | ₺15.764 | ₺10.135 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺34.754 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.4690P.00` | ₺15.524 | ₺9.980 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺34.224 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.5679P.00` | ₺15.348 | ₺9.867 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺33.836 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.36900.P0` | ₺15.055 | ₺9.679 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺33.191 |
| high | Öztiryakiler Endüstriyel Mutfak | `8574.FTL12.00` | ₺15.028 | ₺9.661 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺33.130 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.46800.P0` | ₺14.645 | ₺9.415 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺32.287 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.5670P.00` | ₺14.645 | ₺9.415 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺32.287 |
| high | Öztiryakiler Endüstriyel Mutfak | `8959.PR220.00` | ₺14.412 | ₺9.265 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺31.772 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.36800.P0` | ₺14.236 | ₺9.151 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺31.383 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.46700.P0` | ₺13.896 | ₺8.933 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺30.633 |
| high | Öztiryakiler Endüstriyel Mutfak | `8897.36700.P0` | ₺13.532 | ₺8.699 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺29.833 |
| high | Öztiryakiler Endüstriyel Mutfak | `8593.SU400.00` | ₺13.483 | ₺8.668 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺29.724 |
| high | Öztiryakiler Endüstriyel Mutfak | `8325.B5600.8090` | ₺12.968 | ₺8.337 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺28.589 |
| high | Öztiryakiler Endüstriyel Mutfak | `8325.B5300.7080` | ₺12.242 | ₺7.870 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺26.990 |
| high | PORTABIANCO | `251.1280D` | ₺9.969 | ₺5.827 | L3 oran: ödeme 77.0% (marka medyan 45.0%) — liste KDV dahil ₺12.948 |
| high | Öztiryakiler Endüstriyel Mutfak | `8574.CM250.00` | ₺11.408 | ₺7.334 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺25.151 |
| high | Öztiryakiler Endüstriyel Mutfak | `8574.FM250.00` | ₺11.408 | ₺7.334 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺25.151 |
| high | Öztiryakiler Endüstriyel Mutfak | `8325.B5150.5060` | ₺10.386 | ₺6.677 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺22.897 |
| high | Öztiryakiler Endüstriyel Mutfak | `8325.B5300.5060` | ₺10.386 | ₺6.677 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺22.897 |
| high | PORTABIANCO | `251.1280` | ₺8.895 | ₺5.199 | L3 oran: ödeme 77.0% (marka medyan 45.0%) — liste KDV dahil ₺11.553 |
| high | Öztiryakiler Endüstriyel Mutfak | `8574.CM160.00` | ₺9.956 | ₺6.401 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺21.950 |
| high | Öztiryakiler Endüstriyel Mutfak | `8574.CM120.00` | ₺9.542 | ₺6.134 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺21.036 |
| high | Öztiryakiler Endüstriyel Mutfak | `8760.MT002.00` | ₺9.335 | ₺6.001 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺20.578 |
| high | Öztiryakiler Endüstriyel Mutfak | `8760.MT004.00` | ₺9.335 | ₺6.001 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺20.578 |
| high | Öztiryakiler Endüstriyel Mutfak | `8760.MT006.00` | ₺9.335 | ₺6.001 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺20.578 |
| high | Öztiryakiler Endüstriyel Mutfak | `8224.TCB600EPP` | ₺9.335 | ₺6.001 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺20.578 |
| high | Öztiryakiler Endüstriyel Mutfak | `8224.0ST20.00` | ₺9.335 | ₺6.001 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺20.578 |
| high | Öztiryakiler Endüstriyel Mutfak | `9563.BL811.00` | ₺9.283 | ₺5.968 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺20.466 |
| high | Öztiryakiler Endüstriyel Mutfak | `8593.SU250.00` | ₺9.230 | ₺5.934 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺20.350 |
| high | Öztiryakiler Endüstriyel Mutfak | `8325.B5060.4050` | ₺8.906 | ₺5.726 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺19.635 |
| high | Öztiryakiler Endüstriyel Mutfak | `8959.TIA20.00` | ₺8.645 | ₺5.558 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺19.059 |
| high | Öztiryakiler Endüstriyel Mutfak | `8574.CM080.00` | ₺8.504 | ₺5.467 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺18.749 |
| high | Öztiryakiler Endüstriyel Mutfak | `2919.0B390.AD01.00` | ₺8.384 | ₺5.390 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺18.484 |
| high | Öztiryakiler Endüstriyel Mutfak | `2919.0B390.AD01.00` | ₺8.384 | ₺5.390 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺18.484 |
| high | Öztiryakiler Endüstriyel Mutfak | `9865.BT200.T1` | ₺8.297 | ₺5.334 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺18.292 |
| high | Öztiryakiler Endüstriyel Mutfak | `8564.00001.03` | ₺8.297 | ₺5.334 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺18.292 |
| high | Öztiryakiler Endüstriyel Mutfak | `8760.MT001.00` | ₺8.194 | ₺5.267 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺18.063 |
| high | Öztiryakiler Endüstriyel Mutfak | `8760.MT003.00` | ₺8.194 | ₺5.267 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺18.063 |
| high | Öztiryakiler Endüstriyel Mutfak | `8760.MT005.00` | ₺8.194 | ₺5.267 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺18.063 |
| high | Öztiryakiler Endüstriyel Mutfak | `8593.SU160.00` | ₺7.986 | ₺5.134 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺17.606 |
| high | Öztiryakiler Endüstriyel Mutfak | `8325.ACSHA.06` | ₺7.775 | ₺4.998 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺17.141 |
| high | Öztiryakiler Endüstriyel Mutfak | `8325.ACSHA.15` | ₺7.775 | ₺4.998 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺17.141 |
| high | Öztiryakiler Endüstriyel Mutfak | `8325.ACSHA.30` | ₺7.775 | ₺4.998 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺17.141 |
| high | Öztiryakiler Endüstriyel Mutfak | `8893.04090.00` | ₺7.775 | ₺4.998 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺17.141 |
| high | Öztiryakiler Endüstriyel Mutfak | `8593.SU120.00` | ₺7.571 | ₺4.867 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺16.691 |
| high | Öztiryakiler Endüstriyel Mutfak | `8893.04070.00` | ₺7.253 | ₺4.663 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺15.989 |
| high | Öztiryakiler Endüstriyel Mutfak | `8593.SU080.00` | ₺7.052 | ₺4.534 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺15.548 |
| high | Öztiryakiler Endüstriyel Mutfak | `8893.04050.00` | ₺6.731 | ₺4.327 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺14.838 |
| high | Öztiryakiler Endüstriyel Mutfak | `8325.0KFH5.03` | ₺6.586 | ₺4.234 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺14.518 |
| high | Öztiryakiler Endüstriyel Mutfak | `8325.0KFH5.06` | ₺6.586 | ₺4.234 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺14.518 |
| high | Öztiryakiler Endüstriyel Mutfak | `8325.0KFH5.15` | ₺6.586 | ₺4.234 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺14.518 |
| high | Öztiryakiler Endüstriyel Mutfak | `8325.0KFH5.30` | ₺6.586 | ₺4.234 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺14.518 |
| high | Öztiryakiler Endüstriyel Mutfak | `8564.00001.01` | ₺5.705 | ₺3.667 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺12.576 |
| high | Öztiryakiler Endüstriyel Mutfak | `9823.00100.00` | ₺5.338 | ₺3.432 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺11.768 |
| high | Öztiryakiler Endüstriyel Mutfak | `8325.ACSH7.W3` | ₺5.192 | ₺3.338 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺11.448 |
| high | Öztiryakiler Endüstriyel Mutfak | `8325.ACSH7.W6` | ₺5.192 | ₺3.338 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺11.448 |
| high | Öztiryakiler Endüstriyel Mutfak | `8325.ACSH7.W15` | ₺5.192 | ₺3.338 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺11.448 |
| high | Öztiryakiler Endüstriyel Mutfak | `8325.ACSH7.W30` | ₺5.192 | ₺3.338 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺11.448 |
| high | Öztiryakiler Endüstriyel Mutfak | `2840.16010.03` | ₺4.844 | ₺3.115 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺10.681 |
| high | Öztiryakiler Endüstriyel Mutfak | `6262.DETP9.NS` | ₺4.763 | ₺3.062 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺10.500 |
| high | Öztiryakiler Endüstriyel Mutfak | `6262.PARP8.NS` | ₺4.763 | ₺3.062 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺10.500 |
| high | Öztiryakiler Endüstriyel Mutfak | `8317.ZCP36.20` | ₺4.578 | ₺2.943 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺10.093 |
| high | Öztiryakiler Endüstriyel Mutfak | `2840.16010.04` | ₺3.772 | ₺2.425 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺8.314 |
| high | Öztiryakiler Endüstriyel Mutfak | `8370.USA10.20` | ₺3.742 | ₺2.406 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺8.251 |
| high | Öztiryakiler Endüstriyel Mutfak | `7145.05333.02` | ₺1.776 | ₺479 | L3 oran: ödeme 108.0% (marka medyan 29.2%) — liste KDV dahil ₺1.644 |
| high | Öztiryakiler Endüstriyel Mutfak | `8841.SDC10.00` | ₺3.626 | ₺2.331 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺7.995 |
| high | Öztiryakiler Endüstriyel Mutfak | `8841.SDP10.00` | ₺3.170 | ₺1.902 | L3 oran: ödeme 48.6% (marka medyan 29.2%) — liste KDV dahil ₺6.524 |
| high | Öztiryakiler Endüstriyel Mutfak | `8841.SDC20.00` | ₺3.540 | ₺2.275 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺7.803 |
| high | Öztiryakiler Endüstriyel Mutfak | `2840.16010.05` | ₺3.452 | ₺2.219 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺7.611 |
| high | Öztiryakiler Endüstriyel Mutfak | `2710.00033.33` | ₺3.336 | ₺2.145 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺7.355 |
| high | Öztiryakiler Endüstriyel Mutfak | `2840.16010.06` | ₺3.278 | ₺2.107 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺7.227 |
| high | Öztiryakiler Endüstriyel Mutfak | `9339.0COLE.40` | ₺2.350 | ₺1.511 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺5.181 |
| high | Öztiryakiler Endüstriyel Mutfak | `8224.TCB200EPP` | ₺2.118 | ₺1.361 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺4.669 |
| high | Öztiryakiler Endüstriyel Mutfak | `8841.SDK10.00` | ₺2.030 | ₺1.306 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺4.477 |
| high | Öztiryakiler Endüstriyel Mutfak | `8931.GRV1001` | ₺1.996 | ₺1.283 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺4.400 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.60404.00` | ₺1.747 | ₺1.123 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺3.851 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.60404.10` | ₺1.747 | ₺1.123 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺3.851 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.60404.20` | ₺1.747 | ₺1.123 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺3.851 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.60404.30` | ₺1.747 | ₺1.123 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺3.851 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.60404.40` | ₺1.747 | ₺1.123 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺3.851 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.60404.50` | ₺1.747 | ₺1.123 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺3.851 |
| high | Öztiryakiler Endüstriyel Mutfak | `8650.ZCP04.00` | ₺1.584 | ₺1.018 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺3.491 |
| high | Öztiryakiler Endüstriyel Mutfak | `9339.0COLE.32` | ₺1.566 | ₺1.007 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺3.454 |
| high | Öztiryakiler Endüstriyel Mutfak | `0356.31144.01` | ₺1.477 | ₺950 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺3.257 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.60304.00` | ₺1.310 | ₺842 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺2.888 |
| high | Öztiryakiler Endüstriyel Mutfak | `0440.04730.01` | ₺1.200 | ₺772 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺2.646 |
| high | Öztiryakiler Endüstriyel Mutfak | `8893.UP206.00` | ₺1.172 | ₺753 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺2.583 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.50304.00` | ₺1.092 | ₺702 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺2.407 |
| high | Öztiryakiler Endüstriyel Mutfak | `8310.11200.00` | ₺1.055 | ₺678 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺2.327 |
| high | Öztiryakiler Endüstriyel Mutfak | `8350.71003.0S` | ₺1.044 | ₺671 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺2.302 |
| high | Öztiryakiler Endüstriyel Mutfak | `8350.71003.0K` | ₺1.044 | ₺671 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺2.302 |
| high | Öztiryakiler Endüstriyel Mutfak | `9740.COD21.50` | ₺1.015 | ₺653 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺2.239 |
| high | Öztiryakiler Endüstriyel Mutfak | `9332.00030.00` | ₺858 | ₺515 | L3 oran: ödeme 48.6% (marka medyan 29.2%) — liste KDV dahil ₺1.766 |
| high | Öztiryakiler Endüstriyel Mutfak | `8350.71002.0S` | ₺953 | ₺613 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺2.101 |
| high | Öztiryakiler Endüstriyel Mutfak | `8350.71002.0K` | ₺953 | ₺613 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺2.101 |
| high | Öztiryakiler Endüstriyel Mutfak | `0443.03125.01` | ₺924 | ₺594 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺2.036 |
| high | Öztiryakiler Endüstriyel Mutfak | `8350.71120.0S` | ₺881 | ₺566 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.942 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.60402.00` | ₺874 | ₺561 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.925 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.60402.10` | ₺874 | ₺561 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.925 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.60402.20` | ₺874 | ₺561 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.925 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.60402.30` | ₺874 | ₺561 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.925 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.60402.40` | ₺874 | ₺561 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.925 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.60402.50` | ₺874 | ₺561 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.925 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.60402.01` | ₺874 | ₺561 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.925 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.60402.11` | ₺874 | ₺561 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.925 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.60402.21` | ₺874 | ₺561 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.925 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.60402.31` | ₺874 | ₺561 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.925 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.60402.41` | ₺874 | ₺561 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.925 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.60402.51` | ₺874 | ₺561 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.925 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.60402.51` | ₺874 | ₺561 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.925 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.40304.00` | ₺874 | ₺561 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.925 |
| high | Öztiryakiler Endüstriyel Mutfak | `9740.COD21.46` | ₺870 | ₺560 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺1.919 |
| high | Öztiryakiler Endüstriyel Mutfak | `8310.11150.00` | ₺854 | ₺549 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺1.884 |
| high | Öztiryakiler Endüstriyel Mutfak | `8893.UP203.00` | ₺846 | ₺544 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.864 |
| high | Öztiryakiler Endüstriyel Mutfak | `8893.UP201.00` | ₺811 | ₺522 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺1.788 |
| high | Öztiryakiler Endüstriyel Mutfak | `8740.0BB49.00` | ₺788 | ₺507 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺1.738 |
| high | Öztiryakiler Endüstriyel Mutfak | `8893.UP247.B0` | ₺779 | ₺500 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.716 |
| high | Öztiryakiler Endüstriyel Mutfak | `8740.0BB36.00` | ₺732 | ₺471 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺1.614 |
| high | Öztiryakiler Endüstriyel Mutfak | `8740.00009.00` | ₺726 | ₺467 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.601 |
| high | Öztiryakiler Endüstriyel Mutfak | `0440.04030.07` | ₺710 | ₺457 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺1.567 |
| high | Öztiryakiler Endüstriyel Mutfak | `0443.03125.02` | ₺708 | ₺455 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.561 |
| high | Öztiryakiler Endüstriyel Mutfak | `8740.0BB25.00` | ₺695 | ₺447 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.532 |
| high | Öztiryakiler Endüstriyel Mutfak | `8310.11100.00` | ₺696 | ₺448 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺1.536 |
| high | Öztiryakiler Endüstriyel Mutfak | `8893.UP202.00` | ₺678 | ₺436 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.495 |
| high | Öztiryakiler Endüstriyel Mutfak | `8893.UP200.00` | ₺655 | ₺421 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.444 |
| high | Öztiryakiler Endüstriyel Mutfak | `8740.0BB16.00` | ₺643 | ₺413 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.418 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.53325.00` | ₺626 | ₺403 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺1.382 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.53325.10` | ₺626 | ₺403 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺1.382 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.53325.20` | ₺626 | ₺403 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺1.382 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.53325.30` | ₺626 | ₺403 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺1.382 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.53325.40` | ₺626 | ₺403 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺1.382 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.53325.50` | ₺626 | ₺403 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺1.382 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.53325.01` | ₺626 | ₺403 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺1.382 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.53325.11` | ₺626 | ₺403 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺1.382 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.53325.21` | ₺626 | ₺403 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺1.382 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.53325.31` | ₺626 | ₺403 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺1.382 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.53325.41` | ₺626 | ₺403 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺1.382 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.53325.51` | ₺626 | ₺403 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺1.382 |
| high | Öztiryakiler Endüstriyel Mutfak | `8350.31045.0S` | ₺620 | ₺399 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.367 |
| high | Öztiryakiler Endüstriyel Mutfak | `8350.31045.0K` | ₺620 | ₺399 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.367 |
| high | Öztiryakiler Endüstriyel Mutfak | `8740.0BB09.00` | ₺612 | ₺393 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.349 |
| high | Öztiryakiler Endüstriyel Mutfak | `8317.BO216.00` | ₺611 | ₺392 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.346 |
| high | Öztiryakiler Endüstriyel Mutfak | `8893.UP254.B0` | ₺608 | ₺391 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.340 |
| high | Öztiryakiler Endüstriyel Mutfak | `8740.CKB50.00` | ₺602 | ₺387 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.326 |
| high | Öztiryakiler Endüstriyel Mutfak | `8740.DBB50.00` | ₺602 | ₺387 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.326 |
| high | Öztiryakiler Endüstriyel Mutfak | `8740.0TB50.00` | ₺593 | ₺380 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.305 |
| high | Öztiryakiler Endüstriyel Mutfak | `8310.11065.00` | ₺590 | ₺380 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺1.303 |
| high | Öztiryakiler Endüstriyel Mutfak | `8310.12200.00` | ₺559 | ₺360 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺1.233 |
| high | Öztiryakiler Endüstriyel Mutfak | `9332.TB240.24` | ₺548 | ₺352 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺1.209 |
| high | Öztiryakiler Endüstriyel Mutfak | `8350.31602.0S` | ₺548 | ₺352 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺1.208 |
| high | Öztiryakiler Endüstriyel Mutfak | `8350.31602.0K` | ₺548 | ₺352 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺1.208 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.50302.00` | ₺546 | ₺351 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.203 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.50302.10` | ₺546 | ₺351 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.203 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.50302.20` | ₺546 | ₺351 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.203 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.50302.30` | ₺546 | ₺351 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.203 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.50302.40` | ₺546 | ₺351 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.203 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.50302.50` | ₺546 | ₺351 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.203 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.50302.01` | ₺546 | ₺351 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.203 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.50302.11` | ₺546 | ₺351 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.203 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.50302.21` | ₺546 | ₺351 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.203 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.50302.31` | ₺546 | ₺351 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.203 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.50302.41` | ₺546 | ₺351 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.203 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.50302.51` | ₺546 | ₺351 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.203 |
| high | Öztiryakiler Endüstriyel Mutfak | `9332.00023.50` | ₺457 | ₺274 | L3 oran: ödeme 48.6% (marka medyan 29.2%) — liste KDV dahil ₺940 |
| high | Öztiryakiler Endüstriyel Mutfak | `8350.71081.0S` | ₺496 | ₺319 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.093 |
| high | Öztiryakiler Endüstriyel Mutfak | `8310.12150.00` | ₺464 | ₺299 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺1.024 |
| high | Öztiryakiler Endüstriyel Mutfak | `8350.31044.0S` | ₺457 | ₺294 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.007 |
| high | Öztiryakiler Endüstriyel Mutfak | `8350.31044.0K` | ₺457 | ₺294 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.007 |
| high | Öztiryakiler Endüstriyel Mutfak | `8350.31601.0S` | ₺457 | ₺294 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.007 |
| high | Öztiryakiler Endüstriyel Mutfak | `8350.31601.0K` | ₺457 | ₺294 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺1.007 |
| high | Öztiryakiler Endüstriyel Mutfak | `8310.0PP11.200` | ₺446 | ₺287 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺984 |
| high | Öztiryakiler Endüstriyel Mutfak | `8893.UP246.B0` | ₺438 | ₺281 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺964 |
| high | Öztiryakiler Endüstriyel Mutfak | `8350.31043.0S` | ₺424 | ₺273 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺935 |
| high | Öztiryakiler Endüstriyel Mutfak | `8350.31043.0K` | ₺424 | ₺273 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺935 |
| high | Öztiryakiler Endüstriyel Mutfak | `8740.0BY49.00` | ₺401 | ₺257 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺883 |
| high | Öztiryakiler Endüstriyel Mutfak | `8350.41009.0S` | ₺404 | ₺260 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺892 |
| high | Öztiryakiler Endüstriyel Mutfak | `8350.41009.0B` | ₺404 | ₺260 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺892 |
| high | Öztiryakiler Endüstriyel Mutfak | `8350.31042.0S` | ₺391 | ₺252 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺863 |
| high | Öztiryakiler Endüstriyel Mutfak | `8350.31042.0K` | ₺391 | ₺252 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺863 |
| high | Öztiryakiler Endüstriyel Mutfak | `8310.12100.00` | ₺385 | ₺248 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺850 |
| high | Öztiryakiler Endüstriyel Mutfak | `8740.0BY36.00` | ₺380 | ₺244 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺837 |
| high | Öztiryakiler Endüstriyel Mutfak | `8315.00011.00` | ₺380 | ₺244 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺838 |
| high | Öztiryakiler Endüstriyel Mutfak | `8310.0PP11.150` | ₺374 | ₺241 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺825 |
| high | Öztiryakiler Endüstriyel Mutfak | `8350.31600.0S` | ₺372 | ₺239 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺820 |
| high | Öztiryakiler Endüstriyel Mutfak | `8350.31600.0K` | ₺372 | ₺239 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺820 |
| high | Öztiryakiler Endüstriyel Mutfak | `8740.0BY25.00` | ₺364 | ₺233 | L3 oran: ödeme 45.5% (marka medyan 29.2%) — liste KDV dahil ₺800 |
| high | Öztiryakiler Endüstriyel Mutfak | `8893.UP252.B0` | ₺355 | ₺228 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺782 |
| high | Öztiryakiler Endüstriyel Mutfak | `8350.31041.0S` | ₺353 | ₺227 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺777 |
| high | Öztiryakiler Endüstriyel Mutfak | `8350.31041.0K` | ₺353 | ₺227 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺777 |
| high | Öztiryakiler Endüstriyel Mutfak | `8310.0PPIC.00` | ₺343 | ₺221 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺757 |
| high | Öztiryakiler Endüstriyel Mutfak | `8740.0BY16.00` | ₺331 | ₺213 | L3 oran: ödeme 45.2% (marka medyan 29.2%) — liste KDV dahil ₺732 |
| high | Öztiryakiler Endüstriyel Mutfak | `8310.13150.00` | ₺328 | ₺210 | L3 oran: ödeme 45.5% (marka medyan 29.2%) — liste KDV dahil ₺721 |
| high | Öztiryakiler Endüstriyel Mutfak | `8350.31040.0S` | ₺332 | ₺214 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺734 |
| high | Öztiryakiler Endüstriyel Mutfak | `8350.31040.0K` | ₺332 | ₺214 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺734 |
| high | Öztiryakiler Endüstriyel Mutfak | `8740.BMS35.00` | ₺322 | ₺207 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺709 |
| high | Öztiryakiler Endüstriyel Mutfak | `8310.0PP11.100` | ₺317 | ₺203 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺698 |
| high | Öztiryakiler Endüstriyel Mutfak | `8310.12065.00` | ₺317 | ₺203 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺698 |
| high | Öztiryakiler Endüstriyel Mutfak | `8740.0BY09.00` | ₺317 | ₺204 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺700 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.32526.00` | ₺313 | ₺201 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺691 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.32526.10` | ₺313 | ₺201 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺691 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.32526.20` | ₺313 | ₺201 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺691 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.32526.30` | ₺313 | ₺201 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺691 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.32526.40` | ₺313 | ₺201 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺691 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.32526.50` | ₺313 | ₺201 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺691 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.32526.01` | ₺313 | ₺201 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺691 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.32526.11` | ₺313 | ₺201 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺691 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.32526.21` | ₺313 | ₺201 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺691 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.32526.31` | ₺313 | ₺201 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺691 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.32526.41` | ₺313 | ₺201 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺691 |
| high | Öztiryakiler Endüstriyel Mutfak | `8356.32526.51` | ₺313 | ₺201 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺691 |
| high | Öztiryakiler Endüstriyel Mutfak | `8310.0PP11.65` | ₺269 | ₺173 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺592 |
| high | Öztiryakiler Endüstriyel Mutfak | `8310.0PP12.200` | ₺264 | ₺170 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺581 |
| high | Öztiryakiler Endüstriyel Mutfak | `8893.UP245.B0` | ₺245 | ₺157 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺540 |
| high | Öztiryakiler Endüstriyel Mutfak | `8310.13100.00` | ₺248 | ₺160 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺547 |
| high | Öztiryakiler Endüstriyel Mutfak | `8310.14150.00` | ₺248 | ₺160 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺547 |
| high | Öztiryakiler Endüstriyel Mutfak | `8315.00012.00` | ₺217 | ₺139 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺478 |
| high | Öztiryakiler Endüstriyel Mutfak | `8310.0PP12.150` | ₺211 | ₺136 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺466 |
| high | Öztiryakiler Endüstriyel Mutfak | `8310.13065.00` | ₺211 | ₺136 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺466 |
| high | Öztiryakiler Endüstriyel Mutfak | `8310.14100.00` | ₺200 | ₺129 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺442 |
| high | Öztiryakiler Endüstriyel Mutfak | `8893.UP250.B0` | ₺196 | ₺126 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺432 |
| high | Öztiryakiler Endüstriyel Mutfak | `8315.PPL11.00` | ₺192 | ₺123 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺423 |
| high | Öztiryakiler Endüstriyel Mutfak | `8310.16150.00` | ₺180 | ₺115 | L3 oran: ödeme 45.5% (marka medyan 29.2%) — liste KDV dahil ₺395 |
| high | Öztiryakiler Endüstriyel Mutfak | `8310.0PP12.100` | ₺175 | ₺112 | L3 oran: ödeme 45.5% (marka medyan 29.2%) — liste KDV dahil ₺385 |
| high | Öztiryakiler Endüstriyel Mutfak | `8310.14065.00` | ₺169 | ₺109 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺372 |
| high | Öztiryakiler Endüstriyel Mutfak | `8310.0PP12.65` | ₺148 | ₺94 | L3 oran: ödeme 45.7% (marka medyan 29.2%) — liste KDV dahil ₺324 |
| high | Öztiryakiler Endüstriyel Mutfak | `8310.16100.00` | ₺148 | ₺95 | L3 oran: ödeme 45.5% (marka medyan 29.2%) — liste KDV dahil ₺326 |
| high | Öztiryakiler Endüstriyel Mutfak | `8310.0PP13.150` | ₺144 | ₺93 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺317 |
| high | Öztiryakiler Endüstriyel Mutfak | `8315.00013.00` | ₺138 | ₺88 | L3 oran: ödeme 45.6% (marka medyan 29.2%) — liste KDV dahil ₺303 |
| high | Öztiryakiler Endüstriyel Mutfak | `8310.19150.00` | ₺132 | ₺85 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺292 |
| high | Öztiryakiler Endüstriyel Mutfak | `8310.16065.00` | ₺127 | ₺82 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺279 |
| high | Öztiryakiler Endüstriyel Mutfak | `8310.0PP13.100` | ₺120 | ₺77 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺264 |
| high | Öztiryakiler Endüstriyel Mutfak | `8310.0PP14.150` | ₺115 | ₺74 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺254 |
| high | Öztiryakiler Endüstriyel Mutfak | `8315.00014.00` | ₺112 | ₺72 | L3 oran: ödeme 45.6% (marka medyan 29.2%) — liste KDV dahil ₺246 |
| high | Öztiryakiler Endüstriyel Mutfak | `8310.19100.00` | ₺112 | ₺72 | L3 oran: ödeme 45.6% (marka medyan 29.2%) — liste KDV dahil ₺246 |
| high | Öztiryakiler Endüstriyel Mutfak | `8315.PPL12.00` | ₺106 | ₺68 | L3 oran: ödeme 45.5% (marka medyan 29.2%) — liste KDV dahil ₺233 |
| high | Öztiryakiler Endüstriyel Mutfak | `8310.0PP13.65` | ₺106 | ₺68 | L3 oran: ödeme 45.5% (marka medyan 29.2%) — liste KDV dahil ₺233 |
| high | Öztiryakiler Endüstriyel Mutfak | `8310.0PP14.100` | ₺96 | ₺62 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺212 |
| high | Öztiryakiler Endüstriyel Mutfak | `8310.19065.00` | ₺95 | ₺61 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺209 |
| high | Öztiryakiler Endüstriyel Mutfak | `8315.PPL13.00` | ₺77 | ₺49 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺169 |
| high | Öztiryakiler Endüstriyel Mutfak | `8310.0PP16.100` | ₺77 | ₺49 | L3 oran: ödeme 45.4% (marka medyan 29.2%) — liste KDV dahil ₺169 |
| high | Öztiryakiler Endüstriyel Mutfak | `8310.0PP16.65` | ₺67 | ₺43 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺148 |
| high | Öztiryakiler Endüstriyel Mutfak | `8310.0PP19.150` | ₺67 | ₺43 | L3 oran: ödeme 45.3% (marka medyan 29.2%) — liste KDV dahil ₺148 |
| high | Öztiryakiler Endüstriyel Mutfak | `8310.0PP19.100` | ₺58 | ₺37 | L3 oran: ödeme 45.8% (marka medyan 29.2%) — liste KDV dahil ₺127 |
| high | Öztiryakiler Endüstriyel Mutfak | `8310.0PP19.65` | ₺53 | ₺34 | L3 oran: ödeme 45.5% (marka medyan 29.2%) — liste KDV dahil ₺116 |
| high | Öztiryakiler Endüstriyel Mutfak | `8315.00019.00` | ₺53 | ₺34 | L3 oran: ödeme 45.5% (marka medyan 29.2%) — liste KDV dahil ₺116 |

## L4

| Sev | Marka | SKU | Site | Beklenen | Mesaj |
|-----|-------|-----|-----:|---------:|-------|
| high | Vosco | `VHS-J319` | ₺2.581 | — | L4 anomali: ₺2.581 kategori içinde çok düşük (hazirlik::sebze-dograma-makineleri) |
| high | Öztiryakiler Endüstriyel Mutfak | `RC.52331C` | ₺838.206 | — | L4 anomali: ₺838.206 kategori içinde çok yüksek (hazirlik::robot-coupe-aksesuarlari) |
| high | Öztiryakiler Endüstriyel Mutfak | `RC.53331C` | ₺1.127.632 | — | L4 anomali: ₺1.127.632 kategori içinde çok yüksek (hazirlik::robot-coupe-aksesuarlari) |
| high | Proso Profesyonel Soğutma | `EQ-BUTTERFLY-BR-EQ1` | ₺41.207 | — | L4 anomali: ₺41.207 kategori içinde çok düşük (market-reyon::proso-butik) |
| high | Proso Profesyonel Soğutma | `EQ-BUTTERFLY-BR-EQ2` | ₺44.956 | — | L4 anomali: ₺44.956 kategori içinde çok düşük (market-reyon::proso-butik) |
| high | Proso Profesyonel Soğutma | `EQ-BUTTERFLY-MFT-EQ5` | ₺275.892 | — | L4 anomali: ₺275.892 kategori içinde çok yüksek (market-reyon::proso-butik) |
| high | Atalay Endüstriyel Mutfak Ekipmanları | `ADRM-01` | ₺16.715 | — | L4 anomali: ₺16.715 kategori içinde çok düşük (pisirme::adr-seri-doner-robotu) |
| high | Atalay Endüstriyel Mutfak Ekipmanları | `ADRM-02` | ₺20.893 | — | L4 anomali: ₺20.893 kategori içinde çok düşük (pisirme::adr-seri-doner-robotu) |
| high | Atalay Endüstriyel Mutfak Ekipmanları | `ADRM-03` | ₺41.465 | — | L4 anomali: ₺41.465 kategori içinde çok düşük (pisirme::adr-seri-doner-robotu) |
| high | Atalay Endüstriyel Mutfak Ekipmanları | `ADRM-C1-01` | ₺19.607 | — | L4 anomali: ₺19.607 kategori içinde çok düşük (pisirme::adr-seri-doner-robotu) |
| high | Atalay Endüstriyel Mutfak Ekipmanları | `ADRM-C1-02` | ₺29.893 | — | L4 anomali: ₺29.893 kategori içinde çok düşük (pisirme::adr-seri-doner-robotu) |
| high | Atalay Endüstriyel Mutfak Ekipmanları | `ADR-C1-5` | ₺4.693 | — | L4 anomali: ₺4.693 kategori içinde çok düşük (pisirme::adr-seri-doner-robotu) |
| high | Pimak | `M0168` | ₺11.495 | — | L4 anomali: ₺11.495 kategori içinde çok düşük (pisirme::patates-dinlendirmeler) |
| high | Pimak | `PI4/M009B` | ₺136.507 | — | L4 anomali: ₺136.507 kategori içinde çok yüksek (pisirme::patates-dinlendirmeler) |
| high | Pimak | `PI5/M015B` | ₺179.614 | — | L4 anomali: ₺179.614 kategori içinde çok yüksek (pisirme::patates-dinlendirmeler) |
| high | İnoksan | `INO-9RG25` | ₺391.187 | — | L4 anomali: ₺391.187 kategori içinde çok yüksek (pisirme::kaynatma-tenceleri) |
| high | İnoksan | `INO-ZCO-9RG25` | ₺391.187 | — | L4 anomali: ₺391.187 kategori içinde çok yüksek (pisirme::kaynatma-tenceleri) |
| high | İnoksan | `INO-9RE25` | ₺387.948 | — | L4 anomali: ₺387.948 kategori içinde çok yüksek (pisirme::kaynatma-tenceleri) |
| high | Şenox | `118.KRS009` | ₺582 | — | L4 anomali: ₺582 kategori içinde çok düşük (servis::servis-gerecleri) |
| high | Şenox | `118.SNX.35SC` | ₺9.706 | — | L4 anomali: ₺9.706 kategori içinde çok düşük (sogutma::tezgah-tipi-sogutucular) |
| high | PORTABIANCO | `TTX-2N70` | ₺1.549.924 | — | L4 anomali: ₺1.549.924 kategori içinde çok yüksek (sogutma::sogutma-ekipmanlari) |
| high | Öztiryakiler Endüstriyel Mutfak | `7919.14018.03` | ₺405.107 | — | L4 anomali: ₺405.107 kategori içinde çok yüksek (tasima::banket-arabalari) |
| high | Öztiryakiler Endüstriyel Mutfak | `7819.15G11.11` | ₺459.818 | — | L4 anomali: ₺459.818 kategori içinde çok yüksek (tasima::banket-arabalari) |
| high | Pimak | `DR04-503030.00` | ₺2.873 | — | L4 anomali: ₺2.873 kategori içinde çok düşük (tezgah::depolama-raflari) |
| high | İnoksan | `INO-BYM100-K` | ₺50.970 | — | L4 anomali: ₺50.970 kategori içinde çok düşük (yikama::1000lik) |
| medium | Yüksel Endüstriyel | `M08221` | ₺2.737 | — | L4 anomali: ₺2.737 kategori içinde çok düşük (araba::tasima-arabalari) |
| medium | Yüksel Endüstriyel | `MB130X2` | ₺3.086 | — | L4 anomali: ₺3.086 kategori içinde çok düşük (araba::tasima-arabalari) |
| medium | Öztiryakiler Endüstriyel Mutfak | `7758.166A8.23` | ₺24.053 | — | L4 anomali: ₺24.053 kategori içinde çok düşük (dolap::evyeli-tezgahlar-cift-evyeli-cift-damlalikli-taban-rafli-perdeli-tezgahlar) |
| medium | Vosco | `VHS-J606` | ₺6.788 | — | L4 anomali: ₺6.788 kategori içinde çok düşük (hazirlik::sebze-dograma-makineleri) |
| medium | Öztiryakiler Endüstriyel Mutfak | `RC.2433` | ₺171.911 | — | L4 anomali: ₺171.911 kategori içinde çok yüksek (hazirlik::robot-coupe-aksesuarlari) |
| medium | Öztiryakiler Endüstriyel Mutfak | `RC.24614M` | ₺149.236 | — | L4 anomali: ₺149.236 kategori içinde çok yüksek (hazirlik::robot-coupe-aksesuarlari) |
| medium | Öztiryakiler Endüstriyel Mutfak | `RC.24620` | ₺187.238 | — | L4 anomali: ₺187.238 kategori içinde çok yüksek (hazirlik::robot-coupe-aksesuarlari) |
| medium | Öztiryakiler Endüstriyel Mutfak | `RC.2382` | ₺207.330 | — | L4 anomali: ₺207.330 kategori içinde çok yüksek (hazirlik::robot-coupe-aksesuarlari) |
| medium | Öztiryakiler Endüstriyel Mutfak | `RC.2390` | ₺230.108 | — | L4 anomali: ₺230.108 kategori içinde çok yüksek (hazirlik::robot-coupe-aksesuarlari) |
| medium | Öztiryakiler Endüstriyel Mutfak | `RC.24709M` | ₺211.753 | — | L4 anomali: ₺211.753 kategori içinde çok yüksek (hazirlik::robot-coupe-aksesuarlari) |
| medium | Öztiryakiler Endüstriyel Mutfak | `RC.2115` | ₺271.817 | — | L4 anomali: ₺271.817 kategori içinde çok yüksek (hazirlik::robot-coupe-aksesuarlari) |
| medium | Vosco | `VSC-TZ01` | ₺543 | — | L4 anomali: ₺543 kategori içinde çok düşük (hazirlik::dondurma-makineleri) |
| medium | Vosco | `VSC-TZ02` | ₺543 | — | L4 anomali: ₺543 kategori içinde çok düşük (hazirlik::dondurma-makineleri) |
| medium | Vosco | `VSC-PCS` | ₺1.750 | — | L4 anomali: ₺1.750 kategori içinde çok düşük (kahve::kahve-makineleri) |
| medium | Proso Profesyonel Soğutma | `EQ-BUTTERFLY-BM-EQ1` | ₺59.720 | — | L4 anomali: ₺59.720 kategori içinde çok düşük (market-reyon::proso-butik) |
| medium | Proso Profesyonel Soğutma | `EQ-BUTTERFLY-MFT-EQ4` | ₺244.896 | — | L4 anomali: ₺244.896 kategori içinde çok yüksek (market-reyon::proso-butik) |
| medium | Öztiryakiler Endüstriyel Mutfak | `7856.GN130.05` | ₺10.969 | — | L4 anomali: ₺10.969 kategori içinde çok düşük (pisirme::fritozler) |
| medium | Öztiryakiler Endüstriyel Mutfak | `7856.GN120.08` | ₺11.641 | — | L4 anomali: ₺11.641 kategori içinde çok düşük (pisirme::fritozler) |
| medium | Npicco | `NPICCO331.1` | ₺14.764 | — | L4 anomali: ₺14.764 kategori içinde çok düşük (pisirme::komurlu-izgara) |
| medium | Npicco | `NPICCO330.2` | ₺13.421 | — | L4 anomali: ₺13.421 kategori içinde çok düşük (pisirme::komurlu-izgara) |
| medium | Npicco | `NPICCO330.1` | ₺15.434 | — | L4 anomali: ₺15.434 kategori içinde çok düşük (pisirme::komurlu-izgara) |
| medium | Şenox | `118.8060.MCC` | ₺56.346 | — | L4 anomali: ₺56.346 kategori içinde çok yüksek (servis::servis-gerecleri) |
| medium | Şenox | `118.8060.PPNC` | ₺62.606 | — | L4 anomali: ₺62.606 kategori içinde çok yüksek (servis::servis-gerecleri) |
| medium | Öztiryakiler Endüstriyel Mutfak | `9450.5681A.00` | ₺29.765 | — | L4 anomali: ₺29.765 kategori içinde çok yüksek (set-ustu-mutfak::standart-gastronorm-kuvetler) |
| medium | Öztiryakiler Endüstriyel Mutfak | `9450.5682A.00` | ₺24.409 | — | L4 anomali: ₺24.409 kategori içinde çok yüksek (set-ustu-mutfak::standart-gastronorm-kuvetler) |
| medium | Öztiryakiler Endüstriyel Mutfak | `9450.50050.70` | ₺39.686 | — | L4 anomali: ₺39.686 kategori içinde çok yüksek (set-ustu-mutfak::standart-gastronorm-kuvetler) |
| medium | Öztiryakiler Endüstriyel Mutfak | `79K3.06NMV.01` | ₺78.664 | — | L4 anomali: ₺78.664 kategori içinde çok düşük (sogutma::derin-dondurucu) |
| medium | Öztiryakiler Endüstriyel Mutfak | `79K4.06NMV.01` | ₺70.940 | — | L4 anomali: ₺70.940 kategori içinde çok düşük (sogutma::derin-dondurucu) |
| medium | Öztiryakiler Endüstriyel Mutfak | `79K4.06NMV.11` | ₺76.588 | — | L4 anomali: ₺76.588 kategori içinde çok düşük (sogutma::derin-dondurucu) |
| medium | Şenox | `118.SMR.5120.ST` | ₺20.869 | — | L4 anomali: ₺20.869 kategori içinde çok düşük (sogutma::tezgah-tipi-sogutucular) |
| medium | Öztiryakiler Endüstriyel Mutfak | `2919.0B390.AD01.00` | ₺8.384 | — | L4 anomali: ₺8.384 kategori içinde çok düşük (sogutma::buz-makinesi) |
| medium | Öztiryakiler Endüstriyel Mutfak | `2919.0B390.AD01.00` | ₺8.384 | — | L4 anomali: ₺8.384 kategori içinde çok düşük (sogutma::buz-makinesi) |
| medium | Öztiryakiler Endüstriyel Mutfak | `8360.00007.08` | ₺347 | — | L4 anomali: ₺347 kategori içinde çok düşük (tasima::servis-arabalar) |
| medium | Pimak | `DR04-703030.00` | ₺3.592 | — | L4 anomali: ₺3.592 kategori içinde çok düşük (tezgah::depolama-raflari) |
| medium | Pimak | `DR04-903030.00` | ₺3.951 | — | L4 anomali: ₺3.951 kategori içinde çok düşük (tezgah::depolama-raflari) |
| medium | Pimak | `DR04-1203030.00` | ₺4.670 | — | L4 anomali: ₺4.670 kategori içinde çok düşük (tezgah::depolama-raflari) |
| medium | Pimak | `DR04-1403030.00` | ₺5.208 | — | L4 anomali: ₺5.208 kategori içinde çok düşük (tezgah::depolama-raflari) |
| medium | İnoksan | `INO-BYM102-HR` | ₺151.855 | — | L4 anomali: ₺151.855 kategori içinde çok yüksek (yikama::1000lik) |
| medium | İnoksan | `INO-BYM102N` | ₺150.370 | — | L4 anomali: ₺150.370 kategori içinde çok yüksek (yikama::1000lik) |
| medium | İnoksan | `INO-BYM102T-HR` | ₺148.595 | — | L4 anomali: ₺148.595 kategori içinde çok yüksek (yikama::1000lik) |

## Marka özel denetimler

| Sev | Marka | SKU | Site | Beklenen | Mesaj |
|-----|-------|-----|-----:|---------:|-------|
| medium | rational | `9890.ICCLS20.2E` | ₺1.306.784 | ₺1.224.085 | akakce ₺1.224.085 — Equsto %6.3 pahalı |
| medium | rational | `9890.ICPRO20.1G` | ₺1.198.302 | ₺1.122.467 | akakce ₺1.122.467 — Equsto %6.3 pahalı |
| medium | rational | `9890.ICPRO20.2E` | ₺1.520.425 | ₺1.457.429 | akakce ₺1.457.429 — Equsto %4.1 pahalı |
| medium | rational | `9890.ICPRO10.1E` | ₺627.206 | ₺585.123 | akakce ₺585.123 — Equsto %6.7 pahalı |
| medium | rational | `9890.ICPRO20.1E` | ₺1.060.723 | ₺1.023.166 | akakce ₺1.023.166 — Equsto %3.5 pahalı |
| medium | rational | `9890.ICPRO10.2G` | ₺1.051.164 | ₺1.013.958 | akakce ₺1.013.958 — Equsto %3.5 pahalı |
| medium | rational | `9890.ICCLS20.1G` | ₺1.029.966 | ₺993.494 | akakce ₺993.494 — Equsto %3.5 pahalı |
| medium | rational | `9890.ICCLS20.1E` | ₺911.923 | ₺879.603 | akakce ₺879.603 — Equsto %3.5 pahalı |
| medium | rational | `9890.ICPRO10.2E` | ₺906.104 | ₺874.040 | akakce ₺874.040 — Equsto %3.5 pahalı |
| medium | rational | `9890.ICPRO10.1G` | ₺727.378 | ₺697.461 | akakce ₺697.461 — Equsto %4.1 pahalı |
| medium | rational | `9890.ICCLS10.2G` | ₺825.884 | ₺796.599 | akakce ₺796.599 — Equsto %3.5 pahalı |
| medium | rational | `9890.ICPRO62.G0` | ₺790.555 | ₺762.578 | akakce ₺762.578 — Equsto %3.5 pahalı |
| medium | rational | `9890.ICCLS10.2E` | ₺712.414 | ₺687.120 | akakce ₺687.120 — Equsto %3.6 pahalı |
| medium | rational | `9890.ICPRO62.E0` | ₺681.240 | ₺657.128 | akakce ₺657.128 — Equsto %3.5 pahalı |
| medium | rational | `9890.ICCLS62.G0` | ₺621.388 | ₺599.383 | akakce ₺599.383 — Equsto %3.5 pahalı |
| medium | rational | `9890.ICPRO61.0G` | ₺532.025 | ₺510.259 | akakce ₺510.259 — Equsto %4.1 pahalı |
| medium | rational | `9890.ICCLS10.1G` | ₺571.926 | ₺551.678 | akakce ₺551.678 — Equsto %3.5 pahalı |
| medium | rational | `9890.ICCLS62.E0` | ₺535.765 | ₺516.763 | akakce ₺516.763 — Equsto %3.5 pahalı |
| medium | rational | `9890.ICCLS61.E0` | ₺350.803 | ₺333.819 | akakce ₺333.819 — Equsto %4.8 pahalı |
| medium | rational | `9890.ICCLS10.1E` | ₺492.954 | ₺477.435 | akakce ₺477.435 — Equsto %3.1 pahalı |
| medium | rational | `9890.ICCLS61.0G` | ₺418.138 | ₺403.319 | akakce ₺403.319 — Equsto %3.5 pahalı |
| medium | rational | `9890.ICPROXS.00` | ₺356.622 | ₺341.874 | akakce ₺341.874 — Equsto %4.1 pahalı |
| medium | senox | `118.SLS.02` | ₺67.945 | ₺67.945 | PDF page-order kaynaklı fiyat — manuel doğrulama gerekli |
| medium | senox | `118.SRB12` | ₺19.413 | ₺19.413 | PDF page-order kaynaklı fiyat — manuel doğrulama gerekli |
| medium | senox | `118.SRB.15X3` | ₺22.648 | ₺22.648 | PDF page-order kaynaklı fiyat — manuel doğrulama gerekli |
| medium | senox | `118.SRB20` | ₺22.648 | ₺22.648 | PDF page-order kaynaklı fiyat — manuel doğrulama gerekli |
| medium | senox | `118.SNX17.S` | ₺9.706 | ₺9.706 | PDF page-order kaynaklı fiyat — manuel doğrulama gerekli |
| medium | senox | `118.MC30` | ₺10.353 | ₺10.353 | PDF page-order kaynaklı fiyat — manuel doğrulama gerekli |
| medium | senox | `118.WN.770` | ₺87.357 | ₺87.357 | PDF page-order kaynaklı fiyat — manuel doğrulama gerekli |
| medium | senox | `118.WN.1010` | ₺87.357 | ₺87.357 | PDF page-order kaynaklı fiyat — manuel doğrulama gerekli |
| medium | portabianco | `portabianco-cihaz-alti-monoblok-uc-kapili-buzdol` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-cihaz-alti-monoblok-iki-kapili-buzdo` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-soguk-servis-buzdolabi-5` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-tezgah-alti-slim-buzdolabi-2` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-tezgah-alti-slim-buzdolabi` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-teshir-buzdolabi` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-granit-pizza-buzdolabi` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-pizza-buzdolabi-dort-kapili` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-pizza-buzdolabi-uc-kapili` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-pizza-buzdolabi-iki-kapili` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-pizza-buzdolabi-tek-kapili` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-bar-tipi-sise-sogutucu-2` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-bar-tipi-sise-sogutucu` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-tezgah-tipi-remote` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-soguk-servis-buzdolabi-4` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-soguk-servis-buzdolabi-3` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-soguk-servis-buzdolabi-2` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-soguk-servis-buzdolabi` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-barista-buzdolabi` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-evyeli-buzdolabi` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-mermer-tablali-make-up-buzdolabi-2` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-mermer-tablali-make-up-buzdolabi` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-make-up-buzdolabi` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-make-up-yuksek-borulu-buzdolabi` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-cihaz-alti-kisa-dort-kapili-buzdolab` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-cihaz-alti-kisa-uc-kapili-buzdolabi` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-cihaz-alti-kisa-iki-kapili-buzdolabi` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-cihaz-alti-kisa-tek-kapili-buzdolabi` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-cihaz-alti-uzun-dort-kapili-buzdolab` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-cihaz-alti-uzun-3-kapili-buzdolabi` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-cihaz-alti-uzun-iki-kapili-buzdolabi` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-cihaz-alti-uzun-tek-kapili-buzdolabi` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-cihaz-alti-dort-kapili-buzdolabi` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-cihaz-alti-uc-kapili-buzdolabi` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-cihaz-alti-iki-kapili-buzdolabi` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-cihaz-alti-tek-kapili-buzdolabi` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-dik-tip-iki-kapili-40x60-tepsi-buzdo` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-dik-tip-tek-kapili-40x60-tepsi-buzdo` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-dik-tip-mix-iki-kapili-buzdolabi` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-dik-tip-iki-kapili-monoblok-buzdolab` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-dik-tip-tek-kapili-monoblok-buzdolab` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-dik-tip-iki-kapili-eko-buzdolabi` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-ada-tipi-buzdolabi` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-tezgah-tip-kisa-dort-kapili-buzdolab` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-tezgah-tip-kisa-uc-kapili-buzdolabi` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-tezgah-tip-kisa-iki-kapili-buzdolabi` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-tezgah-tip-kisa-tek-kapili-buzdolabi` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-monoblok-tezgah-tip-uc-kapili-buzdol` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-monoblok-tezgah-tip-iki-kapili-buzdo` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-tezgah-tip-mix-dort-kapili-buzdolabi` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-tezgah-tip-mix-uc-kapili-buzdolabi` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-tezgah-tip-mix-iki-kapili-buzdolabi` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-tezgah-tip-dort-kapili-buzdolabi` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-tezgah-tip-uc-kapili-buzdolabi` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-tezgah-tip-iki-kapili-buzdolabi` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `portabianco-tezgah-tip-tek-kapili-buzdolabi` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `TM1280CK` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `TMHAZ01` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `TM1280C` | ₺0 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `9563.CB699.0D` | ₺18.277 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `9563.HBH65.00` | ₺91.182 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `058.NO.33.GE` | ₺21.734 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `058.NO.62` | ₺89.123 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `058.NO.66` | ₺64.957 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `118.BBL.02` | ₺20.869 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `9563.BL811.00` | ₺9.283 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `9563.HBB90.80` | ₺18.683 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `9563.HBB25.00` | ₺31.565 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `9563.HBB25.S0` | ₺35.104 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `9563.HBH45.00` | ₺50.972 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `VHS-200EG` | ₺7.874 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `VHS-200EK` | ₺7.874 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `VHS-200ES` | ₺7.874 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `VHS-206CK` | ₺5.159 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `VHS-206CM` | ₺6.788 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `VHS-206CS` | ₺5.159 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `VHS-206K` | ₺5.159 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `VHS-206M` | ₺5.159 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `VHS-206S` | ₺5.159 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `VHS-211E` | ₺14.934 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `VHS-212C` | ₺14.934 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `VHS-360CG` | ₺10.318 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `VHS-360CS` | ₺10.318 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `VHS-602CG` | ₺7.874 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `VHS-602CS` | ₺7.874 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `VHS-608` | ₺12.491 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `VHS-608CG` | ₺12.491 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| medium | portabianco | `VHS-608CDG` | ₺12.491 | — | Yuksel veya Cafemarkt kaynağı bulunamadı |
| low | senox | `118.DVF-01` | ₺1.391 | ₺1.391 | PDF (€1000) ile Mutbex (€43) arasında %95.7 fark |
| low | senox | `118.BL25` | ₺8.736 | ₺8.736 | PDF (€270) ile Mutbex (€348.3) arasında %22.5 fark |
| low | senox | `118.BL25C` | ₺13.589 | ₺13.589 | PDF (€420) ile Mutbex (€541.8) arasında %22.5 fark |
| low | senox | `118.BL25L35` | ₺9.383 | ₺9.383 | PDF (€290) ile Mutbex (€374.1) arasında %22.5 fark |
| low | senox | `118.BL25L35C` | ₺14.236 | ₺14.236 | PDF (€440) ile Mutbex (€567.6) arasında %22.5 fark |
| low | senox | `118.BL40` | ₺12.942 | ₺12.942 | PDF (€400) ile Mutbex (€516) arasında %22.5 fark |
| low | senox | `118.BL40C` | ₺13.589 | ₺13.589 | PDF description (€420) ≠ specs (€550) |
| low | senox | `118.BL40C` | ₺13.589 | ₺13.589 | PDF (€420) ile Mutbex (€709.5) arasında %40.8 fark |
| low | senox | `118.BL40L50` | ₺9.383 | ₺9.383 | PDF description (€290) ≠ specs (€425) |
| low | senox | `118.BL40L50` | ₺9.383 | ₺9.383 | PDF (€290) ile Mutbex (€548.25) arasında %47.1 fark |
| low | senox | `118.BL40L50C` | ₺14.236 | ₺14.236 | PDF description (€440) ≠ specs (€575) |
| low | senox | `118.BL40L50C` | ₺14.236 | ₺14.236 | PDF (€440) ile Mutbex (€741.75) arasında %40.7 fark |
| low | senox | `118.BL40L60` | ₺7.280 | ₺7.280 | PDF description (€225) ≠ specs (€450) |
| low | senox | `118.BL40L60` | ₺7.280 | ₺7.280 | PDF (€225) ile Mutbex (€580.5) arasında %61.2 fark |
| low | senox | `118.BL40L60C` | ₺8.089 | ₺8.089 | PDF description (€250) ≠ specs (€600) |
| low | senox | `118.BL40L60C` | ₺8.089 | ₺8.089 | PDF (€250) ile Mutbex (€774) arasında %67.7 fark |
| low | senox | `118.BS.01` | ₺9.706 | ₺9.706 | PDF (€300) ile Mutbex (€387) arasında %22.5 fark |
| low | senox | `118.DY.01` | ₺210.305 | ₺210.305 | PDF (€6500) ile Mutbex (€8385) arasında %22.5 fark |
| low | senox | `118.DY.02` | ₺388.255 | ₺388.255 | PDF (€12000) ile Mutbex (€15480) arasında %22.5 fark |
| low | senox | `118.DY.04` | ₺647.092 | ₺647.092 | PDF (€20000) ile Mutbex (€25800) arasında %22.5 fark |
| low | senox | `118.GGM.M20` | ₺35.590 | ₺35.590 | PDF (€1100) ile Mutbex (€2386.5) arasında %53.9 fark |
| low | senox | `118.GGM.M30` | ₺42.061 | ₺42.061 | PDF (€1300) ile Mutbex (€3031.5) arasında %57.1 fark |
| low | senox | `118.MS10` | ₺27.501 | ₺27.501 | PDF (€850) ile Mutbex (€1096.5) arasında %22.5 fark |
| low | senox | `286.VM01` | ₺9.706 | ₺9.706 | PDF (€300) ile Mutbex (€387) arasında %22.5 fark |
| low | senox | `118.SFT.01` | ₺32.355 | ₺32.355 | PDF (€1000) ile Mutbex (€1290) arasında %22.5 fark |
| low | senox | `118.SFT.02.Pro` | ₺145.596 | ₺145.596 | PDF (€4500) ile Mutbex (€5805) arasında %22.5 fark |
| low | senox | `118.SFT.03.Pro` | ₺152.067 | ₺152.067 | PDF (€4700) ile Mutbex (€6063) arasında %22.5 fark |
| low | senox | `118.MS07` | ₺24.266 | ₺24.266 | PDF (€750) ile Mutbex (€967.5) arasında %22.5 fark |
| low | senox | `118.40.LK.AS` | ₺6.147 | ₺6.147 | PDF description (€190) ≠ specs (€1200) |
| low | senox | `118.40.LK.AS` | ₺6.147 | ₺6.147 | PDF (€190) ile Mutbex (€1548) arasında %87.7 fark |
| low | senox | `118.40.LK` | ₺38.825 | ₺38.825 | PDF description (€1200) ≠ specs (€800) |
| low | senox | `118. IC80A` | ₺22.648 | ₺22.648 | PDF (€700) ile Mutbex (€903) arasında %22.5 fark |
| low | senox | `118.DS.01` | ₺6.147 | ₺6.147 | PDF (€190) ile Mutbex (€245.1) arasında %22.5 fark |
| low | senox | `118.KM01` | ₺12.942 | ₺12.942 | PDF (€400) ile Mutbex (€516) arasında %22.5 fark |
| low | senox | `118.KA18` | ₺60.827 | ₺60.827 | PDF (€1880) ile Mutbex (€2425.2) arasında %22.5 fark |
| low | senox | `118.KA30` | ₺58.238 | ₺58.238 | PDF (€1800) ile Mutbex (€2322) arasında %22.5 fark |
| low | senox | `118.SLS.01` | ₺51.767 | ₺51.767 | PDF (€1600) ile Mutbex (€2064) arasında %22.5 fark |
| low | senox | `118.SLS.02` | ₺67.945 | ₺67.945 | PDF (€2100) ile Mutbex (€2709) arasında %22.5 fark |
| low | senox | `118.SLS.03` | ₺90.593 | ₺90.593 | PDF (€2800) ile Mutbex (€3612) arasında %22.5 fark |
| low | senox | `118.SRB12` | ₺19.413 | ₺19.413 | PDF (€600) ile Mutbex (€774) arasında %22.5 fark |
| low | senox | `118.SRB.15` | ₺14.560 | ₺14.560 | PDF (€450) ile Mutbex (€580.5) arasında %22.5 fark |
| low | senox | `118.SRB.15X2` | ₺35.590 | ₺35.590 | PDF (€1100) ile Mutbex (€903) arasında %17.9 fark |
| low | senox | `118.SRB.15X3` | ₺22.648 | ₺22.648 | PDF (€700) ile Mutbex (€1419) arasında %50.7 fark |
| low | senox | `118.SRB20` | ₺22.648 | ₺22.648 | PDF (€700) ile Mutbex (€903) arasında %22.5 fark |
| low | senox | `118.160LK` | ₺25.884 | ₺25.884 | PDF description (€800) ≠ specs (€2800) |
| low | senox | `118.160LK` | ₺25.884 | ₺25.884 | PDF (€800) ile Mutbex (€3612) arasında %77.9 fark |
| low | senox | `118.300LK` | ₺168.244 | ₺168.244 | PDF description (€5200) ≠ specs (€4600) |
| low | senox | `118.400LK` | ₺184.421 | ₺184.421 | PDF description (€5700) ≠ specs (€5200) |
| low | senox | `118.500.LK` | ₺184.421 | ₺184.421 | PDF (€5700) ile Mutbex (€7353) arasında %22.5 fark |
| low | senox | `118.80LK` | ₺45.296 | ₺45.296 | PDF description (€1400) ≠ specs (€1100) |
| low | senox | `118.80LK.AS` | ₺17.795 | ₺17.795 | PDF description (€550) ≠ specs (€1400) |
| low | senox | `118.80LK.AS` | ₺17.795 | ₺17.795 | PDF (€550) ile Mutbex (€1806) arasında %69.5 fark |
| low | senox | `118.KKM.01` | ₺58.238 | ₺58.238 | PDF (€1800) ile Mutbex (€2322) arasında %22.5 fark |
| low | senox | `118.KRS009` | ₺582 | ₺582 | PDF (€18) ile Mutbex (€23.22) arasında %22.5 fark |
| low | senox | `118.SNX.25.G` | ₺10.677 | ₺10.677 | PDF (€330) ile Mutbex (€425.7) arasında %22.5 fark |
| low | senox | `118.SNX.25.B` | ₺9.706 | ₺9.706 | PDF (€300) ile Mutbex (€425.7) arasında %29.5 fark |
| low | senox | `118.SNX.25.C` | ₺9.706 | ₺9.706 | PDF (€300) ile Mutbex (€425.7) arasında %29.5 fark |
| low | senox | `118.SNX17.S` | ₺9.706 | ₺9.706 | PDF (€300) ile Mutbex (€387) arasında %22.5 fark |
| low | senox | `118.SNX25.S` | ₺9.706 | ₺9.706 | PDF (€300) ile Mutbex (€425.7) arasında %29.5 fark |
| low | senox | `118.SLD.03` | ₺58.238 | ₺58.238 | PDF (€1800) ile Mutbex (€2322) arasında %22.5 fark |
| low | senox | `118.SLD.04` | ₺64.709 | ₺64.709 | PDF (€2000) ile Mutbex (€2580) arasında %22.5 fark |
| low | senox | `118.SNX.17.G` | ₺9.706 | ₺9.706 | PDF (€300) ile Mutbex (€387) arasında %22.5 fark |
| low | senox | `118.SNX.17.B` | ₺9.706 | ₺9.706 | PDF (€300) ile Mutbex (€387) arasında %22.5 fark |
| low | senox | `118.SNX.17.C` | ₺9.706 | ₺9.706 | PDF (€300) ile Mutbex (€387) arasında %22.5 fark |
| low | senox | `118.KASA` | ₺3.883 | ₺3.883 | PDF (€120) ile Mutbex (€154.8) arasında %22.5 fark |
| low | senox | `118.YSO.100` | ₺6.471 | ₺6.471 | PDF (€200) ile Mutbex (€258) arasında %22.5 fark |
| low | senox | `118.YSO.200` | ₺8.089 | ₺8.089 | PDF (€250) ile Mutbex (€322.5) arasında %22.5 fark |
| low | senox | `118.MC30` | ₺10.353 | ₺10.353 | PDF (€320) ile Mutbex (€516) arasında %38 fark |
| low | senox | `118.SNX12R` | ₺74.416 | ₺74.416 | PDF (€2300) ile Mutbex (€2967) arasında %22.5 fark |
| low | senox | `118.SBC.250` | ₺45.296 | ₺45.296 | PDF (€1400) ile Mutbex (€1741.5) arasında %19.6 fark |
| low | senox | `118.BBC.250` | ₺40.443 | ₺40.443 | PDF description (€1250) ≠ specs (€1300) |
| low | senox | `118.BBC.250` | ₺40.443 | ₺40.443 | PDF (€1250) ile Mutbex (€1612.5) arasında %22.5 fark |
| low | senox | `118.SBCS.350` | ₺55.003 | ₺55.003 | PDF (€1700) ile Mutbex (€2193) arasında %22.5 fark |
| low | senox | `118.SBCS.250` | ₺46.985 | ₺46.985 | PDF (€1400) ile Mutbex (€1806) arasında %22.5 fark |
| low | senox | `118.BBCS.250` | ₺40.443 | ₺40.443 | PDF description (€1250) ≠ specs (€1300) |
| low | senox | `118.BBCS.250` | ₺40.443 | ₺40.443 | PDF (€1250) ile Mutbex (€1677) arasında %25.5 fark |
| low | senox | `118.BBC.350` | ₺48.532 | ₺48.532 | PDF description (€1500) ≠ specs (€1600) |
| low | senox | `118.BBC.350` | ₺48.532 | ₺48.532 | PDF (€1500) ile Mutbex (€1935) arasında %22.5 fark |
| low | senox | `118.SBC.350` | ₺55.003 | ₺55.003 | PDF (€1700) ile Mutbex (€2128.5) arasında %20.1 fark |
| low | senox | `118.SDS1510.DC3YF` | ₺97.064 | ₺97.064 | PDF (€3000) ile Mutbex (€3870) arasında %22.5 fark |
| low | senox | `118.BBCS.350` | ₺48.532 | ₺48.532 | PDF description (€1500) ≠ specs (€1600) |
| low | senox | `118.BBCS.350` | ₺48.532 | ₺48.532 | PDF (€1500) ile Mutbex (€2064) arasında %27.3 fark |
| low | senox | `118.SYD310` | ₺42.061 | ₺42.061 | PDF description (€1500) ≠ specs (€1300) |
| low | senox | `118.SYD310` | ₺42.061 | ₺42.061 | PDF (€1300) ile Mutbex (€1677) arasında %22.5 fark |
| low | senox | `118.SYD410` | ₺48.532 | ₺48.532 | PDF description (€1600) ≠ specs (€1500) |
| low | senox | `118.SYD410` | ₺48.532 | ₺48.532 | PDF (€1500) ile Mutbex (€1935) arasında %22.5 fark |
| low | senox | `118.SYD510` | ₺51.767 | ₺51.767 | PDF description (€1300) ≠ specs (€1500) |
| low | senox | `118.SYD510` | ₺51.767 | ₺51.767 | PDF (€1600) ile Mutbex (€2064) arasında %22.5 fark |
| low | senox | `118.ADA.150T` | ₺97.064 | ₺97.064 | PDF (€3000) ile Mutbex (€7740) arasında %61.2 fark |
| low | senox | `118.ADA.180T` | ₺113.241 | ₺113.241 | PDF (€3500) ile Mutbex (€9030) arasında %61.2 fark |
| low | senox | `118.SNX.35SC` | ₺9.706 | ₺9.706 | PDF (€300) ile Mutbex (€387) arasında %22.5 fark |
| low | senox | `118.VN25HA` | ₺14.191 | ₺14.191 | PDF (€1400) ile Mutbex (€438.6) arasında %68.7 fark |
| low | senox | `118.VN25RO` | ₺17.795 | ₺17.795 | PDF (€550) ile Mutbex (€709.5) arasında %22.5 fark |
| low | senox | `118.WD737` | ₺25.884 | ₺25.884 | PDF (€800) ile Mutbex (€1032) arasında %22.5 fark |
| low | senox | `118.DT.100` | ₺51.767 | ₺51.767 | PDF (€1600) ile Mutbex (€2064) arasında %22.5 fark |
| low | senox | `118.DT.200` | ₺58.238 | ₺58.238 | PDF (€1800) ile Mutbex (€2322) arasında %22.5 fark |
| low | senox | `118.DT.600` | ₺323.546 | ₺323.546 | PDF (€10000) ile Mutbex (€12900) arasında %22.5 fark |
| low | senox | `118.DT.12` | ₺452.964 | ₺452.964 | PDF (€14000) ile Mutbex (€18060) arasında %22.5 fark |
| low | senox | `118.DT.13` | ₺452.964 | ₺452.964 | PDF (€14000) ile Mutbex (€18060) arasında %22.5 fark |
| low | senox | `118.DT.18` | ₺582.382 | ₺582.382 | PDF description (€22000) ≠ specs (€18000) |
| low | senox | `118.DT.18` | ₺582.382 | ₺582.382 | PDF (€18000) ile Mutbex (€23220) arasında %22.5 fark |
| low | senox | `118.DT.24` | ₺711.801 | ₺711.801 | PDF (€22000) ile Mutbex (€28380) arasında %22.5 fark |
| low | senox | `118.DT.6` | ₺161.773 | ₺161.773 | PDF description (€6000) ≠ specs (€5000) |
| low | senox | `118.DT.6` | ₺161.773 | ₺161.773 | PDF (€5000) ile Mutbex (€6450) arasında %22.5 fark |
| low | senox | `118.DT.8` | ₺194.127 | ₺194.127 | PDF (€6000) ile Mutbex (€7740) arasında %22.5 fark |
| low | senox | `118.DT.9` | ₺323.546 | ₺323.546 | PDF (€10000) ile Mutbex (€12900) arasında %22.5 fark |
| low | senox | `118.KO.120T` | ₺181.186 | ₺181.186 | PDF (€5600) ile Mutbex (€7224) arasında %22.5 fark |
| low | senox | `118.KOE.150T` | ₺213.540 | ₺213.540 | PDF (€6600) ile Mutbex (€8514) arasında %22.5 fark |
| low | senox | `118.KOE.180T` | ₺258.837 | ₺258.837 | PDF (€8000) ile Mutbex (€10320) arasında %22.5 fark |
| low | senox | `118.MT.153` | ₺113.241 | ₺113.241 | PDF (€3500) ile Mutbex (€4515) arasında %22.5 fark |
| low | senox | `118.SET.67P` | ₺42.061 | ₺42.061 | PDF (€1300) ile Mutbex (€1677) arasında %22.5 fark |
| low | senox | `118.SET.85P` | ₺45.296 | ₺45.296 | PDF (€1400) ile Mutbex (€1806) arasında %22.5 fark |
| low | senox | `118.WN.150` | ₺43.679 | ₺43.679 | PDF (€1350) ile Mutbex (€1741.5) arasında %22.5 fark |
| low | senox | `118.WN.250` | ₺46.914 | ₺46.914 | PDF description (€1700) ≠ specs (€1450) |
| low | senox | `118.WN.250` | ₺46.914 | ₺46.914 | PDF (€1450) ile Mutbex (€1870.5) arasında %22.5 fark |
| low | senox | `118.WN.350` | ₺55.003 | ₺55.003 | PDF (€1700) ile Mutbex (€2193) arasında %22.5 fark |
| low | senox | `118.WN.770` | ₺87.357 | ₺87.357 | PDF (€2700) ile Mutbex (€3483) arasında %22.5 fark |
| low | senox | `118.BBC.150` | ₺35.590 | ₺35.590 | PDF (€1100) ile Mutbex (€1419) arasında %22.5 fark |
| low | senox | `118.SBC.150` | ₺38.825 | ₺38.825 | PDF (€1200) ile Mutbex (€1548) arasında %22.5 fark |
| low | senox | `118.WN.400` | ₺110.006 | ₺110.006 | PDF (€3400) ile Mutbex (€4386) arasında %22.5 fark |
| low | senox | `118.WN.1010` | ₺87.357 | ₺87.357 | PDF (€2700) ile Mutbex (€3483) arasında %22.5 fark |
| low | senox | `118.DM.02` | ₺6.471 | ₺6.471 | PDF (€200) ile Mutbex (€258) arasında %22.5 fark |
| low | senox | `118.DBE.02` | ₺9.706 | ₺9.706 | PDF (€300) ile Mutbex (€387) arasında %22.5 fark |
| low | senox | `118.DBE.01` | ₺8.089 | ₺8.089 | PDF (€250) ile Mutbex (€322.5) arasında %22.5 fark |
| low | senox | `118.DM.01` | ₺5.824 | ₺5.824 | PDF (€180) ile Mutbex (€232.2) arasında %22.5 fark |
| low | senox | `118.HT.10` | ₺32.355 | ₺32.355 | PDF (€1000) ile Mutbex (€1290) arasında %22.5 fark |
| low | senox | `118.HT.12` | ₺35.590 | ₺35.590 | PDF (€1100) ile Mutbex (€1419) arasında %22.5 fark |
| low | senox | `118.HT.15` | ₺38.825 | ₺38.825 | PDF (€1200) ile Mutbex (€1548) arasında %22.5 fark |
| low | senox | `118.TM.01` | ₺5.824 | ₺5.824 | PDF (€180) ile Mutbex (€232.2) arasında %22.5 fark |
| low | rational | `9890.ICCLS20.2G` | ₺1.476.784 | — | Pazarda en ucuz — akakce'dan %5 daha düşük |
| low | rational | `9890.ICPRO20.2G` | ₺1.717.856 | — | Pazarda en ucuz — mutbex'dan %6.6 daha düşük |

---

_Dosya: scripts/data/catalog-agent/full-report.md_
