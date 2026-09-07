"use client";

import {
  defaultMemberDepartmentMembers,
  MemberDepartment,
  type MemberDepartmentMember,
} from "@zeron/blocks/member-department-01";
import {
  BlockDetailPage,
  BlockDetailSection,
} from "@docs/components/blocks/BlockDetailPage";
import { useTranslations } from "next-intl";
import { useState } from "react";

export function MemberDepartmentBlockDocClient({ code }: { code: string }) {
  const t = useTranslations("memberDepartmentBlock");
  const [members, setMembers] = useState<MemberDepartmentMember[]>(() => [
    ...defaultMemberDepartmentMembers,
  ]);

  return (
    <BlockDetailPage
      code={code}
      description={t("description")}
      slug="member-department-01"
      title={t("title")}
      preview={
        <div className="h-[46rem] min-h-0 overflow-hidden bg-surface-raised p-3 sm:p-6">
          <MemberDepartment
            className="h-full"
            members={members}
            onCreateMember={() => {
              setMembers((current) => [
                ...current.filter((member) => member.id !== "new-member"),
                {
                  id: "new-member",
                  name: "新成员",
                  email: "new.member@zentrix.example",
                  functionGroup: "平台工程",
                  status: "invited",
                  departmentId: "platform",
                  departmentPath: ["研发中心", "平台研发"],
                },
              ]);
            }}
          />
        </div>
      }
    >
      <BlockDetailSection title={t("integrationTitle")}>
        <p className="text-body text-fg-muted">{t("integrationBody")}</p>
      </BlockDetailSection>
      <BlockDetailSection title={t("scopeTitle")}>
        <p className="text-body text-fg-muted">{t("scopeBody")}</p>
      </BlockDetailSection>
    </BlockDetailPage>
  );
}
