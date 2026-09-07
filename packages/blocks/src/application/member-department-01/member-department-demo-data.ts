import type { OrganizationNode } from "@zeron/ui/member-tree";
import type {
  MemberDepartmentDepartment,
  MemberDepartmentMember,
} from "./member-department-types";

const avatar = "/sample-avatar.png";

export const defaultMemberDepartmentMembers = [
  { id: "carlos-wei", name: "Carlos Wei", email: "carlos.wei@zentrix.example", avatarUrl: avatar, functionGroup: "平台工程", phone: "+86 138 0000 0101", status: "active", departmentId: "platform", departmentPath: ["研发中心", "平台研发"], },
  { id: "dou-shangmin", name: "窦尚敏", email: "shangmin.dou@zentrix.example", avatarUrl: "/figma/nav-menu-agent-avatar.png", functionGroup: "平台工程", phone: "+86 138 0000 0102", status: "active", departmentId: "platform", departmentPath: ["研发中心", "平台研发"], },
  { id: "wang-chenglong", name: "王承龙", email: "chenglong.wang@zentrix.example", functionGroup: "质量保障", phone: "+86 138 0000 0103", status: "active", departmentId: "quality", departmentPath: ["研发中心", "测试中心"], },
  { id: "liu-siya", name: "刘思雅", email: "siya.liu@zentrix.example", functionGroup: "质量保障", status: "invited", departmentId: "quality", departmentPath: ["研发中心", "测试中心"], },
  { id: "zhou-rui", name: "周睿", email: "rui.zhou@zentrix.example", avatarUrl: "/figma/zstack-account-menu/avatar.jpeg", functionGroup: "前端工程", phone: "+86 138 0000 0105", status: "active", departmentId: "frontend", departmentPath: ["研发中心", "前端研发"], },
  { id: "lin-yue", name: "林悦", email: "yue.lin@zentrix.example", functionGroup: "前端工程", phone: "+86 138 0000 0106", status: "active", departmentId: "frontend", departmentPath: ["研发中心", "前端研发"], },
  { id: "chen-mo", name: "陈默", email: "mo.chen@zentrix.example", functionGroup: "后端工程", phone: "+86 138 0000 0107", status: "active", departmentId: "backend", departmentPath: ["研发中心", "后端研发"], },
  { id: "xu-yan", name: "徐妍", email: "yan.xu@zentrix.example", functionGroup: "后端工程", status: "suspended", departmentId: "backend", departmentPath: ["研发中心", "后端研发"], },
  { id: "tang-qi", name: "唐祺", email: "qi.tang@zentrix.example", functionGroup: "管理层", phone: "+86 138 0000 0109", status: "active", departmentId: "executive", departmentPath: ["执行办公室"], },
  { id: "zhao-ning", name: "赵宁", email: "ning.zhao@zentrix.example", functionGroup: "人力资源", phone: "+86 138 0000 0110", status: "active", departmentId: "people", departmentPath: ["人力资源部"], },
  { id: "wu-fan", name: "吴凡", email: "fan.wu@zentrix.example", functionGroup: "财务", phone: "+86 138 0000 0111", status: "active", departmentId: "finance", departmentPath: ["财务部"], },
  { id: "sun-hao", name: "孙浩", email: "hao.sun@zentrix.example", functionGroup: "海外销售", phone: "+86 138 0000 0112", status: "active", departmentId: "international-sales", departmentPath: ["海外销售部"], },
  { id: "he-jing", name: "何静", email: "jing.he@zentrix.example", functionGroup: "国内销售", status: "departed", departmentId: "domestic-sales", departmentPath: ["国内销售部"], leftAt: "2026-06-30", },
] as const satisfies readonly MemberDepartmentMember[];

export const defaultMemberDepartmentTree = [
  {
    key: "zentrix",
    label: "Zentrix",
    type: "department",
    departmentId: "zentrix",
    children: [
      {
        key: "research-and-development",
        label: "研发中心",
        type: "department",
        departmentId: "research-and-development",
        children: [
          { key: "platform", label: "平台研发", type: "department", departmentId: "platform" },
          { key: "quality", label: "测试中心", type: "department", departmentId: "quality" },
          { key: "frontend", label: "前端研发", type: "department", departmentId: "frontend" },
          { key: "backend", label: "后端研发", type: "department", departmentId: "backend" },
        ],
      },
      { key: "executive", label: "执行办公室", type: "department", departmentId: "executive" },
      { key: "people", label: "人力资源部", type: "department", departmentId: "people" },
      { key: "finance", label: "财务部", type: "department", departmentId: "finance" },
      { key: "international-sales", label: "海外销售部", type: "department", departmentId: "international-sales" },
      { key: "domestic-sales", label: "国内销售部", type: "department", departmentId: "domestic-sales" },
    ],
  },
] as const satisfies readonly OrganizationNode[];

export const defaultMemberDepartmentDirectory = [
  {
    id: "research-and-development",
    name: "研发中心",
    owner: {
      name: "User",
      email: "user@zstack.io",
      avatarUrl: avatar,
    },
    status: "active",
    children: [
      { id: "platform", name: "平台组", status: "active" },
      { id: "quality", name: "测试组", status: "active" },
      { id: "frontend", name: "前端组", status: "active" },
      { id: "backend", name: "后端组", status: "active" },
    ],
  },
  {
    id: "people",
    name: "人力资源",
    owner: { name: "User", email: "user@zstack.io" },
    status: "active",
    children: [
      { id: "recruiting", name: "招聘组", status: "active" },
      { id: "people-partner", name: "人力伙伴组", status: "active" },
    ],
  },
  {
    id: "finance",
    name: "财务",
    owner: { name: "User", email: "user@zstack.io" },
    status: "active",
    children: [
      { id: "accounting", name: "会计组", status: "active" },
      { id: "financial-planning", name: "财务规划组", status: "active" },
    ],
  },
  {
    id: "international-sales",
    name: "国际销售",
    owner: { name: "User", email: "user@zstack.io" },
    status: "active",
    children: [
      { id: "apac-sales", name: "亚太销售组", status: "active" },
      { id: "emea-sales", name: "欧洲销售组", status: "active" },
    ],
  },
  {
    id: "domestic-sales",
    name: "国内销售",
    owner: { name: "User", email: "user@zstack.io" },
    status: "active",
    children: [
      { id: "east-sales", name: "华东销售组", status: "active" },
      { id: "south-sales", name: "华南销售组", status: "active" },
      { id: "north-sales", name: "华北销售组", status: "active" },
    ],
  },
] as const satisfies readonly MemberDepartmentDepartment[];
