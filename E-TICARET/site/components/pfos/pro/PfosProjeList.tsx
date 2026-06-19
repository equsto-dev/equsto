"use client";

import { StarFilled } from "@ant-design/icons";
import type { ProColumns } from "@ant-design/pro-components";
import { ProTable, StatisticCard } from "@ant-design/pro-components";
import { Alert, Col, Row, Tag, Typography } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  PfosProjeProfil,
  PfosProjeRow,
  PfosProjelerResponse,
} from "@/lib/pfos/projects/types";
import { zoneLabel } from "@/lib/pfos/wizard/zone-labels";
import { useAdminTablePagination } from "@/lib/yonetim/table-pagination";

export default function PfosProjeList() {
  const [bundle, setBundle] = useState<PfosProjelerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tablePagination = useAdminTablePagination(20, bundle?.projects.length);

  useEffect(() => {
    fetch("/api/pfos/projects", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then((j) => {
        setBundle({
          projects: j.projects,
          profiles: j.profiles,
          stats: j.stats,
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Yüklenemedi"))
      .finally(() => setLoading(false));
  }, []);

  const zoneValueEnum = useMemo(() => {
    const map: Record<string, { text: string }> = {};
    for (const z of bundle?.stats.zones ?? []) {
      map[z] = { text: zoneLabel(z) };
    }
    return map;
  }, [bundle?.stats.zones]);

  const columns: ProColumns<PfosProjeRow>[] = useMemo(
    () => [
      {
        title: "ID",
        dataIndex: "id",
        width: 96,
        fixed: "left",
        copyable: true,
        search: false,
        render: (_, r) => (
          <>
            {r.referans ? (
              <StarFilled style={{ color: "#faad14", marginRight: 4 }} />
            ) : null}
            {r.id}
          </>
        ),
      },
      {
        title: "Proje",
        dataIndex: "baslik",
        ellipsis: true,
        width: 280,
        fieldProps: { placeholder: "ID veya proje adı" },
      },
      {
        title: "Yıl",
        dataIndex: "yil",
        width: 72,
        valueType: "select",
        valueEnum: Object.fromEntries(
          (bundle?.stats.yillar ?? []).map((y) => [y, { text: y }]),
        ),
      },
      {
        title: "Konsept",
        dataIndex: "konsept",
        width: 110,
        ellipsis: true,
        valueType: "select",
        valueEnum: Object.fromEntries(
          (bundle?.stats.konseptler ?? []).map((k) => [k, { text: k }]),
        ),
      },
      {
        title: "Dükkan / profil",
        dataIndex: "dukkan",
        width: 180,
        ellipsis: true,
        valueType: "select",
        valueEnum: Object.fromEntries(
          (bundle?.stats.dukkanlar ?? []).map((d) => [d, { text: d }]),
        ),
      },
      {
        title: "Zone",
        dataIndex: "zones",
        hideInTable: true,
        valueType: "select",
        valueEnum: zoneValueEnum,
        fieldProps: { showSearch: true },
      },
      {
        title: "Bölümler",
        dataIndex: "zones",
        search: false,
        width: 220,
        render: (_, r) => (
          <>
            {r.zones.slice(0, 4).map((z) => (
              <Tag key={z} style={{ marginBottom: 2 }}>
                {zoneLabel(z)}
              </Tag>
            ))}
            {r.zones.length > 4 ? (
              <Tag>+{r.zones.length - 4}</Tag>
            ) : null}
          </>
        ),
      },
      {
        title: "Profil önerisi",
        dataIndex: "profilOneri",
        search: false,
        width: 200,
        ellipsis: true,
        render: (_, r) =>
          r.profilOneri ? (
            <span>
              {r.profilOneri}
              {r.profilSkor > 0 ? (
                <Typography.Text type="secondary" style={{ marginLeft: 4 }}>
                  %{r.profilSkor}
                </Typography.Text>
              ) : null}
            </span>
          ) : (
            "—"
          ),
      },
      {
        title: "Satır",
        dataIndex: "lineCount",
        search: false,
        width: 64,
        align: "right",
      },
      {
        title: "Dosya",
        dataIndex: "fileCount",
        search: false,
        width: 64,
        align: "right",
      },
      {
        title: "DWG",
        dataIndex: "dwgUrl",
        search: false,
        width: 56,
        render: (_, r) =>
          r.dwgUrl ? (
            <a href={r.dwgUrl} target="_blank" rel="noreferrer">
              Plan
            </a>
          ) : (
            "—"
          ),
      },
      {
        title: "Durum",
        dataIndex: "status",
        width: 80,
        search: false,
        render: (_, r) => (
          <Tag color={r.referans ? "gold" : r.status === "ok" ? "green" : "default"}>
            {r.referans ? "referans" : r.status}
          </Tag>
        ),
      },
    ],
    [bundle, zoneValueEnum],
  );

  const filterProjects = useCallback(
    (params: Record<string, unknown>, data: PfosProjeRow[]) => {
      let rows = data;
      const q = String(params.baslik ?? "").trim().toLowerCase();
      if (q) {
        rows = rows.filter(
          (p) =>
            p.id.toLowerCase().includes(q) ||
            p.baslik.toLowerCase().includes(q) ||
            p.folder.toLowerCase().includes(q),
        );
      }
      if (params.yil) rows = rows.filter((p) => p.yil === params.yil);
      if (params.konsept) rows = rows.filter((p) => p.konsept === params.konsept);
      if (params.dukkan) rows = rows.filter((p) => p.dukkan === params.dukkan);
      if (params.zones) {
        const z = String(params.zones);
        rows = rows.filter((p) => p.zones.includes(z));
      }
      return { data: rows, success: true, total: rows.length };
    },
    [],
  );

  if (error) {
    return <Alert type="error" message={error} showIcon />;
  }

  const stats = bundle?.stats;

  return (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <StatisticCard
            loading={loading}
            statistic={{ title: "Toplam proje", value: stats?.total ?? 0 }}
          />
        </Col>
        <Col xs={12} sm={6}>
          <StatisticCard
            loading={loading}
            statistic={{ title: "Referans (4)", value: stats?.referans ?? 0 }}
          />
        </Col>
        <Col xs={12} sm={6}>
          <StatisticCard
            loading={loading}
            statistic={{
              title: "Konsept çeşidi",
              value: stats?.konseptler.length ?? 0,
            }}
          />
        </Col>
        <Col xs={12} sm={6}>
          <StatisticCard
            loading={loading}
            statistic={{
              title: "Zone tipi",
              value: stats?.zones.length ?? 0,
            }}
          />
        </Col>
      </Row>

      {bundle?.profiles.length ? (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="PFOS profil eşlemesi"
          description={
            <>
              Zone listesi{" "}
              <Typography.Text code>pfos-zone-proje-kurallari.json</Typography.Text>{" "}
              profilleriyle karşılaştırılır. Referans projeler (
              {bundle.profiles
                .flatMap((p: PfosProjeProfil) => p.sourceProjects ?? [])
                .filter(Boolean)
                .slice(0, 4)
                .join(", ")}
              ) altın yıldızla işaretlidir.
            </>
          }
        />
      ) : null}

      <ProTable<PfosProjeRow>
        rowKey="id"
        loading={loading}
        columns={columns}
        scroll={{ x: 1200 }}
        pagination={tablePagination}
        options={{ density: true, reload: false }}
        search={{ labelWidth: "auto", defaultCollapsed: false }}
        request={async (params) =>
          filterProjects(params, bundle?.projects ?? [])
        }
        params={bundle?.projects}
        expandable={{
          expandedRowRender: (r) => (
            <ProjeExpandDetail r={r} profiles={bundle?.profiles ?? []} />
          ),
        }}
        toolBarRender={() => [
          <Typography.Text key="src" type="secondary" style={{ fontSize: 12 }}>
            Kaynak: pfos-archive-extract.json
          </Typography.Text>,
        ]}
      />
    </>
  );
}

function ProjeExpandDetail({
  r,
  profiles,
}: {
  r: PfosProjeRow;
  profiles: PfosProjeProfil[];
}) {
  const profil = profiles.find((p) =>
    (p.sourceProjects ?? []).includes(r.id),
  );

  return (
    <div style={{ padding: "8px 0" }}>
      <Typography.Paragraph copyable={{ text: r.folder }}>
        <strong>Klasör:</strong> {r.folder}
      </Typography.Paragraph>
      {profil ? (
        <Typography.Paragraph>
          <strong>Referans profil:</strong> {profil.konsept} · {profil.dukkan}
          <br />
          <strong>PFOS zones:</strong>{" "}
          {profil.pfosZones.map((z) => zoneLabel(z)).join(", ")}
        </Typography.Paragraph>
      ) : null}
      <Typography.Paragraph>
        <strong>Tüm bölümler:</strong>{" "}
        {r.zones.map((z) => zoneLabel(z)).join(" · ") || "—"}
      </Typography.Paragraph>
    </div>
  );
}
