import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { CoverageGraph } from "../components/CoverageGraph"
import { useWebSocket } from "../context/WebSocketContext"
import { getTestStats } from "../utils/testStats"
import { CoveringExamples } from "../components/CoveringExamples"
import { WebSocketProvider } from "../context/WebSocketContext"

export function TestPage() {
  const { nodeid } = useParams<{ nodeid: string }>()

  return (
    <WebSocketProvider nodeId={nodeid}>
      <_TestPage />
    </WebSocketProvider>
  )
}

function _TestPage() {
  const { nodeid } = useParams<{ nodeid: string }>()
  const { reports, metadata } = useWebSocket()
  const [pycrunchAvailable, setPycrunchAvailable] = useState<boolean>(false)

  useEffect(() => {
    if (nodeid) {
      fetch(`/api/pycrunch/${nodeid}`)
        .then(response => response.json())
        .then(data => {
          setPycrunchAvailable(data.available)
        })
        .catch(error => {
          console.error("Failed to check PyCrunch availability:", error)
          setPycrunchAvailable(false)
        })
    }
  }, [nodeid])

  if (!nodeid || !reports[nodeid]) {
    return <div>Test not found</div>
  }

  const testReports = reports[nodeid]
  const testMetadata = metadata[nodeid]
  const stats = getTestStats(testReports[testReports.length - 1])

  return (
    <div className="test-details">
      <Link to="/" className="back-link">
        ← Back to all tests
      </Link>
      <h1>{nodeid}</h1>
      {pycrunchAvailable && (
        <div className="pycrunch-link">
          <a
            href={`https://app.pytrace.com/?open=http://${window.location.host}/api/pycrunch/${nodeid}/session.chunked`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open in Pytrace
          </a>
        </div>
      )}
      <div className="test-info">
        <div className="info-grid">
          <div className="info-item">
            <label>Inputs</label>
            <div>{stats.inputs}</div>
          </div>
          <div className="info-item">
            <label>Branches</label>
            <div>{stats.branches}</div>
          </div>
          <div className="info-item">
            <label>Executions</label>
            <div>{stats.executions}</div>
          </div>
          <div className="info-item">
            <label>Inputs since branch</label>
            <div>{stats.inputsSinceBranch}</div>
          </div>
          <div className="info-item">
            <label>Time spent</label>
            <div>{stats.timeSpent}</div>
          </div>
        </div>
      </div>
      <CoverageGraph reports={{ [nodeid]: testReports }} />

      {testMetadata.failures && testMetadata.failures.length > 0 && (
        <div className="test-failure">
          <h2>Failure</h2>
          {testMetadata.failures.map(
            ([callRepr, _, reproductionDecorator, traceback], index) => (
              <div key={index} className="test-failure__item">
                <h3>Call</h3>
                <pre>
                  <code>{reproductionDecorator + "\n" + callRepr}</code>
                </pre>
                <h3>Traceback</h3>
                <pre>
                  <code>{traceback}</code>
                </pre>
              </div>
            ),
          )}
        </div>
      )}

      {testMetadata.seed_pool && (
        <CoveringExamples seedPool={testMetadata.seed_pool} />
      )}
    </div>
  )
}
