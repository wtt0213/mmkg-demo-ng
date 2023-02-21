import { useState } from 'react';
import { Layout, Row, Col, Input, Card, Button, Empty, Upload, Image, Spin, Avatar, message } from 'antd';
import { CaretRightOutlined, InboxOutlined } from '@ant-design/icons';
import axios from 'axios';
import qs from 'qs';

import logo from './logo.png';
import './App.less';

const { Header, Content, Footer } = Layout;
const { TextArea } = Input;
const { Dragger } = Upload;
const { Meta } = Card;

const tabList = [
  { key: 'entity', tab: '实体/关系' },
  { key: 'event', tab: '事件抽取' },
  { key: 'graph', tab: '知识图谱' },
];

function EntityContent(props) {
  let src = null;
  let src2 = null;
  if (props.inputText && props.inputText.indexOf("姜糖水可以治疗由风寒导致的感冒") !== -1 && props.inputText.indexOf("中美科研团队在最新一期") !== -1) {
    src = "/sample1.html";
    src2 = "/static/ner1.html";
  } else if (props.inputText && props.inputText.indexOf("犯罪嫌疑人程某指") !== -1 && props.inputText.indexOf("澎湃新闻记者从上海市青浦区检察院获悉") !== -1) {
    src = "/sample2.html";
    src2 = "/static/ner2.html";
  }

  return (
    src === null ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /> : (
      <div className="entity-content-wrapper">
        <Card className="algorithm-card">
          <Meta
            avatar={<Avatar src="/static/logo.png" />}
            title="OpenKS领域实体识别模块"
            description="DomainEntityExtractPaddle.entity_lst(Args)"
          />
        </Card>
        <iframe className="entity-content-iframe" src={src2}></iframe>
        <iframe className="entity-content-iframe" src={src}></iframe>
      </div>
    )
  );
}

function EventContent(props) {
  let src = null
  if (props.inputText && props.inputText.indexOf("姜糖水可以治疗由风寒导致的感冒") !== -1 && props.inputText.indexOf("中美科研团队在最新一期") !== -1) {
    src = "https://local.yfint.yunfutech.com/casetext/1";
  } else if (props.inputText && props.inputText.indexOf("犯罪嫌疑人程某指") !== -1 && props.inputText.indexOf("澎湃新闻记者从上海市青浦区检察院获悉") !== -1) {
    src = "https://local.yfint.yunfutech.com/casetext/2";
  }

  return (
    src === null ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /> : (
      <div className="event-content-wrapper">
        <Card className="algorithm-card">
          <Meta
            avatar={<Avatar src="/static/logo.png" />}
            title="OpenKS事件抽取模块"
            description="EventExtractionPaddle(event)"
          />
        </Card>
        <iframe className="event-content-iframe" src={src} scrolling="no"></iframe>
      </div>
    )
  );
}

function getWords() {
  const graph = JSON.parse(document.getElementById("graph-content-iframe").contentWindow.statements_graph.replaceAll(/&#39;/g, '"'));
  const words = graph.nodes
		.filter(x => /* x.category === 1 || */x.category === 3)
		.map(x => x.category === 1 ? x.sent : x.name)
		.filter(x => x && !x.startsWith("__"))
		.map(x => x.replaceAll(" ", ""));
  return words;
}

function GraphContent(props) {
  const [previewImageURL, setPreviewImageURL] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState([]);

  return (
    <div className="graph-content-wrapper">
      <Card className="algorithm-card">
        <Meta
          avatar={<Avatar src="/static/logo.png" />}
          title="OpenKS概念（上位词）挖掘模块"
          description="HypernymExtractPaddle.entity2hyper_lst(entity)"
        />
      </Card>
      <Card className="algorithm-card">
        <Meta
          avatar={<Avatar src="/static/logo.png" />}
          title="OpenKS上下位关系检测模块"
          description="HypernymDiscoveryPaddle(HypernymDiscoveryModel)"
        />
      </Card>
      <Card className="algorithm-card">
        <Meta
          avatar={<Avatar src="/static/logo.png" />}
          title="OpenKS视觉实体链接模块"
          description="VisualEntityLinking(image, text)"
        />
      </Card>
      {
        props.graphPage && (
          <div className="graph-content-image-upload-wrapper">
            <Dragger
              name="image"
              multiple={false}
              action="https://api0.mmkg.sota.wiki/v1/mmkg_demo"
              data={() => ({sents_form: JSON.stringify(getWords())})}
              showUploadList={false}
              beforeUpload={file => {
                if (file.type.indexOf("image") === -1) {
                  message.error(`只支持图片文件: ${file.name}`);
                  return Upload.LIST_IGNORE;
                }
                setPreviewImageURL(window.URL.createObjectURL(file));
                return true;
              }}
              onChange={({ file }) => {
                if (file.status === "uploading") {
                  setUploading(true);
                } else if (file.status === "done") {
                  setUploading(false);
                  const rsp = file.response;
                  if (rsp.code === 0) {
                    const sorted_words = rsp.data.sort((a, b) => b[2] - a[2]);
                    setResults(sorted_words);
                  } else {
                    console.error(rsp);
                  }
                }
              }}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">增加新图像及链接入图谱</p>
              <p className="ant-upload-hint">点击上传图片文件</p>
            </Dragger>
            {
              previewImageURL && (
                <div className="preview-image-wrapper">
                  <Spin spinning={uploading}>
                    <Image width={200} src={previewImageURL} />
                  </Spin>
                </div>
              )
            }
            {
              results && results.length > 0 && (
                <div className="img-to-text-results-wrapper">
                  {
                    results.map(item => (
                      <div className="img-to-text-result-box">
                        <div className="word">{item[0]}: </div>
                        <div className="score">{item[2].toFixed(4)}</div>
                      </div>
                    ))
                  }
                </div>
              )
            }
          </div>
        )
      }
      {
        props.graphPage === null ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /> : (
          <iframe id="graph-content-iframe" srcDoc={props.graphPage} onLoad={e => {
            setTimeout(() => e.target.contentWindow.comp_graphs(), 1);
          }}></iframe>
        )
      }
      {
        props.graphPage && (
          <div id="div0">
            <div id="bigcilin">
              <div id="entity0"></div>
              <div id="entity1"></div>
              <div id="entity2"></div>
            </div>
          </div>
        )
      }
    </div>
  );
}

const defaultText = "姜糖水可以治疗由风寒导致的感冒。中美科研团队在最新一期《细胞》杂志撰文称, 他们制造出首个由人类细胞和猴子细胞共同组成的胚胎, 这些嵌合体有助科学家进一步在其它物种体内（如猪）培育出人体组织, 但最新研究也引发了一些伦理争议。";

const fetchGraphPage = async (text) => {
  return await axios.post("https://api0.mmkg.sota.wiki/legacy/structuring", qs.stringify({ text: text }));
};

function App() {
  const [inputText, setInputText] = useState(defaultText);
  const [activeTabKey, setActiveTabKey] = useState('entity');
  const [cardLoading, setCardLoading] = useState(false);
  const [graphPage, setGraphPage] = useState(null);

  const [graphPageLastText, setGraphPageLastText] = useState('');

  return (
    <Layout className="app" style={{ minHeight: '100vh' , backgroundColor : '#FFFFFF'}}>
      <Header className="app-header">
        <Row justify="center">
          <Col span={3} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <img className="app-logo" src={logo} alt="logo" />
          </Col>
          <Col span={18} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <span className="app-titile">自动化知识发现与图谱构建</span>
          </Col>
          <Col span={3} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          </Col>
        </Row>
      </Header>
      <Content>
        <Row justify="center" style={{margin : '10px'}}>
          <Col span={16}>
            <Card title="输入文本" style={{ borderWidth : '2px', borderColor: '#CCCCCC', borderRadius : '10px', boxShadow: '4px 4px #CCCCCC' }}>
              <TextArea
                showCount
                rows={6}
                maxLength={1000}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
              ></TextArea>
              <br />
              <div className="btn-run-wrapper">
                <Button
                  type="primary"
                  size="large"
                  shape="round"
                  icon={<CaretRightOutlined />}
                  loading={cardLoading}
                  onClick={async () => {
                    if (activeTabKey === "graph") {
                      setCardLoading(true);
                      try {
                        const rsp = await fetchGraphPage(inputText);
                        setGraphPageLastText(inputText);
                        setGraphPage(rsp.data);
                      } catch (e) {
                        console.error(e);
                        setGraphPageLastText('');
                        setGraphPage(null);
                      } finally {
                        setCardLoading(false);
                      }
                    }
                  }}
                >
                  运行
                </Button>
              </div>
            </Card>
          </Col>
        </Row>
        <Row justify="center" style={{margin : '10px'}}>
          <Col span={16}>
            <Card style={{  borderWidth : '2px', borderColor: '#CCCCCC', borderRadius : '10px', boxShadow: '4px 4px #CCCCCC'}}
              className="results-card-wrapper"
              title="结果"
              tabList={tabList}
              activeTabKey={activeTabKey}
              onTabChange={async (key) => {
                if (!cardLoading) {
                  if (key === "graph" && graphPageLastText !== inputText) {
                    setCardLoading(true);
                    try {
                      const rsp = await fetchGraphPage(inputText);
                      setGraphPageLastText(inputText);
                      setGraphPage(rsp.data);
                    } catch (e) {
                      console.error(e);
                      setGraphPageLastText('');
                      setGraphPage(null);
                    } finally {
                      setCardLoading(false);
                    }
                  }
                  setActiveTabKey(key);
                }
              }}
              loading={cardLoading}
            >
              {activeTabKey === "entity" ? <EntityContent inputText={inputText} /> : (activeTabKey === "event" ? <EventContent inputText={inputText} /> : <GraphContent graphPage={graphPage} />)}
            </Card>
          </Col>
        </Row>
      </Content>
      <Footer style={{ textAlign: 'center', backgroundColor : '#FFFFFF', color : '#999999' }}>Copyright © 2022量知数据研发出品</Footer>
    </Layout>
  );
}

export default App;
