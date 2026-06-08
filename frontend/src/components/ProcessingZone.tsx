import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  InputNumber,
  message,
  Space,
  Tag,
  Progress,
  Input,
  Dropdown,
  Alert,
  Descriptions,
  Divider,
  Statistic,
  Row,
  Col,
  Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import {
  ReloadOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import {
  appointmentsApi,
  releasesApi,
  Appointment,
  AppointmentStatus,
  ComputeDetentionResult,
  SubmitActualPackagesResult,
} from '../services/api';
import dayjs from 'dayjs';

const statusText: Record<AppointmentStatus, string> = {
  pending: '待办',
  queued: '排队中',
  arrived: '已到场',
  loading: '装卸中',
  completed: '已完成',
  released: '已放行',
  cancelled: '已取消',
};

const statusColor: Record<AppointmentStatus, string> = {
  pending: 'gold',
  queued: 'blue',
  arrived: 'cyan',
  loading: 'purple',
  completed: 'green',
  released: 'default',
  cancelled: 'red',
};

const STANDARD_MINUTES = 60;

const ProcessingZone: React.FC = () => {
  const [data, setData] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [packageModal, setPackageModal] = useState<{ open: boolean; record?: Appointment }>({ open: false });
  const [actualPkgModal, setActualPkgModal] = useState<{ open: boolean; record?: Appointment }>({ open: false });
  const [releaseModal, setReleaseModal] = useState<{ open: boolean; record?: Appointment }>({ open: false });
  const [detentionPanel, setDetentionPanel] = useState<{
    open: boolean;
    record?: Appointment;
    computeResult?: ComputeDetentionResult;
    computing?: boolean;
  }>({ open: false });

  const [pkgForm] = Form.useForm();
  const [actualPkgForm] = Form.useForm();
  const [releaseForm] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const list = await appointmentsApi.processing();
      setData(list);
    } catch (e: any) {
      message.error('加载处理区数据失败：' + (e.message || e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(() => {
      fetchData();
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const updateStatus = async (record: Appointment, status: AppointmentStatus) => {
    try {
      await appointmentsApi.update(record.id, { status });
      message.success(`状态已更新为：${statusText[status]}`);
      fetchData();
    } catch (e: any) {
      message.error('更新失败：' + (e.response?.data?.message || e.message));
    }
  };

  const handlePackages = async (values: any) => {
    if (!packageModal.record) return;
    try {
      await appointmentsApi.handlePackages(packageModal.record.id, values.packages);
      message.success('计件处理成功');
      setPackageModal({ open: false });
      pkgForm.resetFields();
      fetchData();
    } catch (e: any) {
      message.error('处理失败：' + (e.response?.data?.message || e.message));
    }
  };

  const handleSubmitActualPackages = async (values: any) => {
    if (!actualPkgModal.record) return;
    try {
      const res: SubmitActualPackagesResult = await appointmentsApi.submitActualPackages(
        actualPkgModal.record.id,
        values.actualPackages,
        values.reviewNote,
      );
      if (res.needsReview) {
        Modal.warning({
          title: '件数差异复核提醒',
          content: (
            <div>
              <p>
                预报件数：<b>{actualPkgModal.record.totalPackages}</b>，实际件数：
                <b>{values.actualPackages}</b>
              </p>
              <p>
                差异比例：<b style={{ color: '#f5222d' }}>{res.diffPercent}%</b>，已超过 10% 阈值，
                系统已自动标记为需复核。
              </p>
              {values.reviewNote && <p>复核备注：{values.reviewNote}</p>}
            </div>
          ),
        });
      } else {
        message.success(`实际件数已录入（差异 ${res.diffPercent}%，无需复核）`);
      }
      setActualPkgModal({ open: false });
      actualPkgForm.resetFields();
      fetchData();
    } catch (e: any) {
      message.error('录入失败：' + (e.response?.data?.message || e.message));
    }
  };

  const openDetentionPanel = async (record: Appointment) => {
    setDetentionPanel({ open: true, record, computing: true });
    try {
      const res = await appointmentsApi.computeDetentionFee(record.id);
      setDetentionPanel({ open: true, record, computeResult: res, computing: false });
    } catch (e: any) {
      message.error('计算滞留罚金失败：' + (e.response?.data?.message || e.message));
      setDetentionPanel({ open: true, record, computing: false });
    }
  };

  const handlePayDetention = async (paid: boolean) => {
    if (!detentionPanel.record) return;
    try {
      await appointmentsApi.payDetention(detentionPanel.record.id, paid);
      message.success(paid ? '已标记：罚金已缴' : '已取消罚金已缴标记');
      setDetentionPanel({ open: false });
      fetchData();
    } catch (e: any) {
      message.error('操作失败：' + (e.response?.data?.message || e.message));
    }
  };

  const handleUpdateDetentionFee = async (fee: number) => {
    if (!detentionPanel.record) return;
    try {
      await appointmentsApi.payDetention(detentionPanel.record.id, detentionPanel.record.detentionPaid, fee);
      message.success('滞留罚金已更新');
      const res = await appointmentsApi.computeDetentionFee(detentionPanel.record.id);
      setDetentionPanel({ ...detentionPanel, computeResult: res });
      fetchData();
    } catch (e: any) {
      message.error('更新失败：' + (e.response?.data?.message || e.message));
    }
  };

  const handleRelease = async (values: any) => {
    if (!releaseModal.record) return;
    try {
      await releasesApi.create({
        appointmentId: releaseModal.record.id,
        detentionFee: values.detentionFee,
        releasedBy: values.releasedBy,
        remarks: values.remarks,
      });
      message.success('车辆已放行');
      setReleaseModal({ open: false });
      releaseForm.resetFields();
      fetchData();
    } catch (e: any) {
      message.error('放行失败：' + (e.response?.data?.message || e.message));
    }
  };

  const getNodeMenu = (record: Appointment): MenuProps['items'] => {
    const items: MenuProps['items'] = [];
    if (record.status === 'queued') {
      items.push({ key: 'arrived', label: '确认到场 → 已到场' });
    }
    if (record.status === 'arrived') {
      items.push({ key: 'loading', label: '开始装卸 → 装卸中' });
    }
    if (record.status === 'loading') {
      items.push({ key: 'completed', label: '装卸完成 → 已完成' });
    }
    return items;
  };

  const handleNodeClick = (key: string, record: Appointment) => {
    updateStatus(record, key as AppointmentStatus);
  };

  const computeLiveDuration = (record: Appointment) => {
    if (!record.startedAt) return null;
    const end = record.completedAt ? dayjs(record.completedAt) : dayjs();
    const start = dayjs(record.startedAt);
    const mins = end.diff(start, 'minute');
    return mins;
  };

  const canRelease = (record: Appointment) => {
    if (record.status !== 'completed') return false;
    if (Number(record.detentionFee) > 0 && !record.detentionPaid) return false;
    return true;
  };

  const columns: ColumnsType<Appointment> = [
    { title: '预约号', dataIndex: 'appointmentNo', width: 130, fixed: 'left' },
    {
      title: '承运商',
      dataIndex: ['carrier', 'name'],
      width: 160,
      render: (_, r) => r.carrier?.name || '-',
    },
    { title: '车牌号', dataIndex: 'plateNumber', width: 110 },
    { title: '月台号', dataIndex: 'dockNumber', width: 90, render: (v) => v || '-' },
    {
      title: '装卸件数',
      width: 220,
      render: (_, r) => {
        const total = r.totalPackages || 0;
        const handled = r.handledPackages || 0;
        const actual = r.actualPackages || 0;
        const diff = total > 0 ? Math.abs(actual - total) / total : 0;
        return (
          <div>
            <Progress
              percent={total > 0 ? Math.round((handled / total) * 100) : 0}
              format={() => `装卸进度 ${handled}/${total}`}
              size="small"
            />
            <div style={{ fontSize: 12, marginTop: 4 }}>
              {actual > 0 ? (
                <Space>
                  <span>实际录入：<b>{actual}</b></span>
                  {diff > 0.1 ? (
                    <Tag color="orange">
                      ⚠️ 差异 {(diff * 100).toFixed(1)}%，需复核
                    </Tag>
                  ) : actual > 0 ? (
                    <Tag color="green">差异 {(diff * 100).toFixed(1)}%</Tag>
                  ) : null}
                </Space>
              ) : (
                <span style={{ color: '#999' }}>未录入实际件数</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: AppointmentStatus) => <Tag color={statusColor[v]}>{statusText[v]}</Tag>,
    },
    {
      title: '滞留罚金（处理区）',
      width: 220,
      render: (_, r) => {
        const liveMins = computeLiveDuration(r);
        const over = liveMins != null ? Math.max(0, liveMins - (r.standardDurationMinutes || STANDARD_MINUTES)) : null;
        const fee = Number(r.detentionFee || 0);
        return (
          <div>
            <Space style={{ marginBottom: 4 }}>
              {fee > 0 ? (
                <Tag color="red" className="detention-tag">
                  ¥ {fee.toFixed(2)}
                </Tag>
              ) : (
                <span style={{ color: '#999' }}>无罚金</span>
              )}
              {fee > 0 &&
                (r.detentionPaid ? (
                  <Tag color="green">
                    ✓ 已缴
                  </Tag>
                ) : (
                  <Tag color="orange">
                    ⚠️ 未缴
                  </Tag>
                ))}
            </Space>
            <div style={{ fontSize: 12, color: '#666', lineHeight: 1.5 }}>
              {liveMins != null && (
                <div>
                  ⏱ 已用时 {liveMins} 分钟
                  {over != null && over > 0 && (
                    <span style={{ color: '#f5222d', marginLeft: 4 }}>（超时 {over} 分钟）</span>
                  )}
                </div>
              )}
            </div>
            <Button
              size="small"
              type="link"
              style={{ padding: 0, height: 'auto' }}
              onClick={() => openDetentionPanel(r)}
            >
              🧮 罚金详情/缴纳
            </Button>
          </div>
        );
      },
    },
    {
      title: '节点时间',
      width: 200,
      render: (_, r) => (
        <div style={{ fontSize: 12, color: '#666', lineHeight: 1.6 }}>
          {r.arrivedAt && <div>到场：{dayjs(r.arrivedAt).format('MM-DD HH:mm')}</div>}
          {r.startedAt && <div>开始：{dayjs(r.startedAt).format('MM-DD HH:mm')}</div>}
          {r.completedAt && <div>完成：{dayjs(r.completedAt).format('MM-DD HH:mm')}</div>}
        </div>
      ),
    },
    {
      title: '操作',
      width: 320,
      fixed: 'right',
      render: (_, r) => {
        const nodeMenu = getNodeMenu(r) || [];
        return (
          <Space size={4} wrap>
            <Dropdown
              menu={{
                items: nodeMenu,
                onClick: ({ key }) => handleNodeClick(key, r),
              }}
              disabled={nodeMenu.length === 0}
            >
            <Button size="small" type="primary">
              更新节点
            </Button>
          </Dropdown>
          {r.status === 'loading' && (
            <Button size="small" onClick={() => { pkgForm.resetFields(); setPackageModal({ open: true, record: r }); }}>
              装卸计件
            </Button>
          )}
          {(r.status === 'loading' || r.status === 'completed' || r.status === 'arrived') && (
            <Button
              size="small"
              onClick={() => {
                actualPkgForm.setFieldsValue({
                  actualPackages: r.actualPackages || r.handledPackages || r.totalPackages || 0,
                  reviewNote: r.reviewNote || '',
                });
                setActualPkgModal({ open: true, record: r });
              }}
            >
              录入实际件数
            </Button>
          )}
          {r.status === 'completed' && (
            <Tooltip
              title={
                !canRelease(r) && Number(r.detentionFee) > 0 && !r.detentionPaid
                  ? '滞留罚金未缴纳，请先在"罚金详情/缴纳"中标记已缴'
                  : ''
              }
            >
              <Button
                size="small"
                type="primary"
                danger
                disabled={!canRelease(r)}
                onClick={() => {
                  releaseForm.setFieldsValue({
                    detentionFee: r.detentionFee || 0,
                    releasedBy: '系统管理员',
                    remarks: r.remarks || '',
                  });
                  setReleaseModal({ open: true, record: r });
                }}
              >
                放行
              </Button>
            </Tooltip>
          )}
        </Space>
        );
      },
    },
  ];

  return (
    <div className="zone-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div className="section-title" style={{ marginBottom: 0 }}>
          月台窗口处理区（滞留罚金 + 装卸计件复核在此区展示）
        </div>
        <Space>
          <Tag color="blue">标准时长 {STANDARD_MINUTES} 分钟</Tag>
          <Tag color="red">超时每分钟 ¥1</Tag>
          <Tag color="orange">差异超 10% 需复核</Tag>
          <Button icon={<ReloadOutlined />} onClick={fetchData}>
            刷新
          </Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        size="small"
        loading={loading}
        dataSource={data}
        columns={columns}
        pagination={{ pageSize: 5 }}
        scroll={{ x: 1600 }}
      />

      <Modal
        title="装卸计件（累计处理进度）"
        open={packageModal.open}
        onCancel={() => setPackageModal({ open: false })}
        onOk={() => pkgForm.submit()}
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message='此操作用于累计装卸进度；如需录入最终实际件数并触发差异复核，请使用「录入实际件数」按钮。'
        />
        <p style={{ marginBottom: 16 }}>
          当前预约：{packageModal.record?.appointmentNo}（车牌号：{packageModal.record?.plateNumber}）
          <br />
          已处理：{packageModal.record?.handledPackages || 0} / 总件数：{packageModal.record?.totalPackages || 0}
        </p>
        <Form form={pkgForm} layout="vertical" onFinish={handlePackages}>
          <Form.Item label="本次处理件数" name="packages" rules={[{ required: true, message: '请输入件数' }]}>
            <InputNumber
              min={1}
              max={(packageModal.record?.totalPackages || 0) - (packageModal.record?.handledPackages || 0)}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="录入实际装卸件数（差异复核）"
        open={actualPkgModal.open}
        onCancel={() => setActualPkgModal({ open: false })}
        onOk={() => actualPkgForm.submit()}
        width={520}
      >
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="录入完成后，系统将自动比对预报件数，差异超过 10% 会触发复核提醒并标记该单。"
        />
        <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
          <Descriptions.Item label="预约号">{actualPkgModal.record?.appointmentNo}</Descriptions.Item>
          <Descriptions.Item label="车牌号">{actualPkgModal.record?.plateNumber}</Descriptions.Item>
          <Descriptions.Item label="预报件数">{actualPkgModal.record?.totalPackages}</Descriptions.Item>
          <Descriptions.Item label="已装卸进度">{actualPkgModal.record?.handledPackages}</Descriptions.Item>
        </Descriptions>
        <Form form={actualPkgForm} layout="vertical" onFinish={handleSubmitActualPackages}>
          <Form.Item
            label="实际装卸件数"
            name="actualPackages"
            rules={[{ required: true, message: '请输入实际件数' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="复核备注（如有差异请填写说明）" name="reviewNote">
            <Input.TextArea rows={3} placeholder="如件数差异原因、破损、补发等情况说明" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="🧮 滞留罚金处理面板"
        open={detentionPanel.open}
        onCancel={() => setDetentionPanel({ open: false })}
        width={640}
        footer={[
          <Button key="close" onClick={() => setDetentionPanel({ open: false })}>
            关闭
          </Button>,
          detentionPanel.record && Number(detentionPanel.record.detentionFee || 0) > 0 && !detentionPanel.record.detentionPaid ? (
            <Button
              key="pay"
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => handlePayDetention(true)}
            >
              标记罚金已缴
            </Button>
          ) : null,
          detentionPanel.record && detentionPanel.record.detentionPaid ? (
            <Button key="unpay" danger onClick={() => handlePayDetention(false)}>
              取消已缴标记
            </Button>
          ) : null,
        ]}
      >
        {detentionPanel.computing && <Alert type="info" showIcon message="正在计算滞留罚金..." />}
        {!detentionPanel.computing && detentionPanel.computeResult && (
          <div>
            <Alert
              type={Number(detentionPanel.computeResult.fee) > 0 ? 'error' : 'success'}
              showIcon
              style={{ marginBottom: 16 }}
              message={
                Number(detentionPanel.computeResult.fee) > 0
                  ? `已产生滞留罚金 ¥${detentionPanel.computeResult.fee.toFixed(2)}，请收费后标记"罚金已缴"才能放行。`
                  : '装卸时长未超过标准，暂无滞留罚金。'
              }
            />
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="实际用时"
                  value={detentionPanel.computeResult.actualMinutes}
                  suffix="分钟"
                  prefix="⏱ "
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="标准时长"
                  value={detentionPanel.record?.standardDurationMinutes || STANDARD_MINUTES}
                  suffix="分钟"
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="超时时长"
                  value={detentionPanel.computeResult.overtimeMinutes}
                  suffix="分钟"
                  valueStyle={{
                    color: detentionPanel.computeResult.overtimeMinutes > 0 ? '#f5222d' : '#389e0d',
                  }}
                />
              </Col>
            </Row>
            <Divider />
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="计费标准">
                ¥{Number(detentionPanel.record?.detentionRatePerMinute || 1).toFixed(2)} / 分钟
              </Descriptions.Item>
              <Descriptions.Item label="当前罚金">
                <b style={{ color: Number(detentionPanel.computeResult.fee) > 0 ? '#f5222d' : '#389e0d' }}>
                  ¥{Number(detentionPanel.record?.detentionFee || detentionPanel.computeResult.fee).toFixed(2)}
                </b>
              </Descriptions.Item>
              <Descriptions.Item label="缴纳状态">
                {detentionPanel.record?.detentionPaid ? (
                  <Tag color="green">✓ 已缴</Tag>
                ) : Number(detentionPanel.computeResult.fee) > 0 ? (
                  <Tag color="orange">⚠️ 未缴</Tag>
                ) : (
                  <Tag>无需缴纳</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="装卸开始">
                {detentionPanel.record?.startedAt
                  ? dayjs(detentionPanel.record.startedAt).format('YYYY-MM-DD HH:mm')
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="装卸完成" span={2}>
                {detentionPanel.record?.completedAt
                  ? dayjs(detentionPanel.record.completedAt).format('YYYY-MM-DD HH:mm')
                  : '（装卸进行中，罚金实时计算）'}
              </Descriptions.Item>
            </Descriptions>
            <Divider orientation="left">手动调整罚金（如有特殊情况）</Divider>
            <Space.Compact style={{ width: '100%' }}>
              <InputNumber
                min={0}
                step={10}
                precision={2}
                style={{ width: '70%' }}
                defaultValue={Number(detentionPanel.record?.detentionFee || detentionPanel.computeResult.fee)}
                addonBefore="调整罚金金额"
                addonAfter="元"
                id="detention-fee-input"
              />
              <Button
                type="primary"
                onClick={() => {
                  const el = document.getElementById('detention-fee-input') as HTMLInputElement | null;
                  const input = el?.querySelector?.('input') as HTMLInputElement | null;
                  const v = input ? Number(input.value) : 0;
                  handleUpdateDetentionFee(Number.isFinite(v) ? v : 0);
                }}
              >
                保存调整
              </Button>
            </Space.Compact>
          </div>
        )}
      </Modal>

      <Modal
        title="车辆放行确认"
        open={releaseModal.open}
        onCancel={() => setReleaseModal({ open: false })}
        onOk={() => releaseForm.submit()}
      >
        {releaseModal.record &&
          Number(releaseModal.record.detentionFee || 0) > 0 &&
          !releaseModal.record.detentionPaid && (
            <Alert
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
              message='滞留罚金未缴纳，不能放行！请返回处理区，先在罚金处理面板中标记「罚金已缴」。'
            />
          )}
        <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
          <Descriptions.Item label="预约号">{releaseModal.record?.appointmentNo}</Descriptions.Item>
          <Descriptions.Item label="车牌号">{releaseModal.record?.plateNumber}</Descriptions.Item>
          <Descriptions.Item label="预报件数">{releaseModal.record?.totalPackages}</Descriptions.Item>
          <Descriptions.Item label="实际件数">
            {releaseModal.record?.actualPackages || releaseModal.record?.handledPackages || 0}
          </Descriptions.Item>
          <Descriptions.Item label="滞留罚金">
            ¥{Number(releaseModal.record?.detentionFee || 0).toFixed(2)}
          </Descriptions.Item>
          <Descriptions.Item label="缴纳状态">
            {releaseModal.record?.detentionPaid ? (
              <Tag color="green">已缴</Tag>
            ) : Number(releaseModal.record?.detentionFee || 0) > 0 ? (
              <Tag color="red">未缴</Tag>
            ) : (
              <Tag>无需缴纳</Tag>
            )}
          </Descriptions.Item>
        </Descriptions>
        <Form form={releaseForm} layout="vertical" onFinish={handleRelease}>
          <Form.Item label="滞留罚金（元）" name="detentionFee">
            <InputNumber min={0} step={10} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="放行人" name="releasedBy" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="放行备注" name="remarks">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProcessingZone;
