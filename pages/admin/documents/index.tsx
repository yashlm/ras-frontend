import {
  Button,
  Container,
  MenuItem,
  Modal,
  Select,
  SelectChangeEvent,
  Stack,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid";
// import { GridColDef, GridValueGetterParams } from "@mui/x-data-grid";
import { GridColDef } from "@mui/x-data-grid";
import * as React from "react";
import { useEffect, useState } from "react";

import adminDocumentsRequest, {
  AllStudentDocumentsResponse,
} from "@callbacks/admin/student/documents";
import DataGrid from "@components/DataGrid";
import Clarification from "@components/Modals/clarification";
import Meta from "@components/Meta";
import useStore from "@store/store";
import { CDN_URL } from "@callbacks/constants";

const transformName = (name: string) => {
  const nname = name.replace(`${CDN_URL}/view/`, "");
  const nameArray = nname.split(".");
  const newName = nameArray[0].slice(14, -33);
  const newNameWithExtension = `${newName}.${nameArray[1]}`;
  return newNameWithExtension;
};

const getURL = (url: string) => `${CDN_URL}/view/${url}`;

const documentTypes = [
  "10th Marksheet",
  "12th Marksheet",
  "Pingala Transcript",
  "JEE Mains Result",
  "JEE Advanced  Result",
  "All",
];

function AcceptDocumentButton(props: {
  docid: number;
  updateCallback: () => Promise<void>;
}) {
  const { token } = useStore();
  const { docid, updateCallback } = props;
  return (
    <Button
      variant="contained"
      sx={{
        marginInlineEnd: "0.5rem",
      }}
      onClick={() => {
        adminDocumentsRequest
          .putVerify(token, docid, { verified: true })
          .then(() => {
            updateCallback();
          });
      }}
    >
      Accept
    </Button>
  );
}

function RejectResumeButton(props: {
  docid: number;
  updateCallback: () => Promise<void>;
}) {
  const { token } = useStore();
  const { docid, updateCallback } = props;
  return (
    <Button
      variant="contained"
      onClick={() => {
        adminDocumentsRequest
          .putVerify(token, docid, { verified: false })
          .then(() => {
            updateCallback();
          });
      }}
    >
      Reject
    </Button>
  );
}

function AskClarification(props: {
  role: number;
  sid: string;
  row: AllStudentDocumentsResponse;
}) {
  const { role, sid, row } = props;
  const [openNew, setOpenNew] = useState(false);
  const handleOpenNew = () => {
    setOpenNew(true);
  };
  const handleCloseNew = () => {
    setOpenNew(false);
  };
  // if (!params.row.verified?.Valid || role === 100 || role === 101) {
  return !row.verified || role === 100 || role === 101 ? (
    <div>
      <Modal open={openNew} onClose={handleCloseNew}>
        <Clarification
          handleCloseNew={handleCloseNew}
          studentID={sid}
          context={`Your documents ${getURL(row.path)}`}
        />
      </Modal>
      <Button sx={{ height: 30 }} onClick={handleOpenNew}>
        CLICK HERE
      </Button>
    </div>
  ) : (
    <div />
  );
}
function Index() {
  const [type, setType] = useState<string>(documentTypes[5]);
  const [allDocuments, setAllDocuments] = useState<
    AllStudentDocumentsResponse[]
  >([]);
  const { token, role } = useStore();

  const updateTable = React.useCallback(async () => {
    if (type === "All") {
      const res = await adminDocumentsRequest.getAll(token);
      if (res !== null && res?.length > 0) setAllDocuments(res);
      else setAllDocuments([]);
    } else {
      const res = await adminDocumentsRequest.getByType(token, type);
      if (res !== null && res?.length > 0) setAllDocuments(res);
      else setAllDocuments([]);
    }
  }, [token, type]);

  useEffect(() => {
    updateTable();
  }, [updateTable]);

  const handleChangeType = (e: SelectChangeEvent<string>) => {
    setType(e.target.value);
    setAllDocuments([]);
    updateTable();
  };

  const columns: GridColDef[] = [
    {
      field: "ID",
      headerName: "Document ID",
    },
    {
      field: "CreatedAt",
      headerName: "Created At",
      hide: true,
    },
    {
      field: "UpdatedAt",
      headerName: "Updated At",
      hide: true,
    },
    {
      field: "type",
      headerName: "Document Type",
      hide: false,
    },
    // {
    //   field: "name",
    //   headerName: "Student Name",
    //   renderCell: (params) => (
    //     <Tooltip title={params.value}>
    //       <div>{params.value}</div>
    //     </Tooltip>
    //   ),
    // },
    // {
    //   field: "email",
    //   headerName: "Student Email",
    //   renderCell: (params) => (
    //     <Tooltip title={params.value}>
    //       <div>{params.value}</div>
    //     </Tooltip>
    //   ),
    // },
    // {
    //   field: "roll_no",
    //   headerName: "Student Roll No",
    // },
    {
      field: "path",
      headerName: "Documents Link",
      sortable: false,
      align: "center",
      width: 400,
      headerAlign: "center",
      valueGetter: (params) => getURL(params?.value),
      renderCell: (params) => (
        <Button
          variant="contained"
          sx={{ width: "100%" }}
          onClick={() => {
            window.open(params.value, "_blank");
          }}
        >
          {transformName(params.value)}
        </Button>
      ),
    },
    {
      field: "verified",
      headerName: "Verification Status",
      align: "center",
      headerAlign: "center",
      valueGetter: ({ value }) => {
        if (value) {
          if (value) return "Accepted";
          return "Rejected";
        }
        if (!value?.Valid) return "Pending Verification";
        return "Unkown";
      },
    },
    {
      field: "action_taken_by",
      headerName: "Action Taken By",
      align: "center",
      headerAlign: "center",
      hide: true,
    },

    {
      field: "AskClarification",
      headerName: "Ask Clarification",
      align: "center",
      headerAlign: "center",
      // eslint-disable-next-line consistent-return
      renderCell: (params) => (
        <AskClarification role={role} sid={params.row.sid} row={params.row} />
      ),
      // eslint-disable-next-line react-hooks/rules-of-hooks
    },
    {
      field: "options",
      headerName: "",
      align: "center",
      // eslint-disable-next-line consistent-return
      renderCell: (cellValues) => {
        if (!cellValues.row.verified || role === 100 || role === 101) {
          return (
            <Container>
              <AcceptDocumentButton
                docid={cellValues.row.ID}
                updateCallback={updateTable}
              />
              <RejectResumeButton
                docid={cellValues.row.ID}
                updateCallback={updateTable}
              />
            </Container>
          );
        }
      },
    },
  ];

  return (
    <div>
      <Meta title="Documents Dashboard" />
      <Stack direction="column" padding={1} alignItems="flex-start">
        <Typography>Select Type</Typography>
        <Select
          labelId="select-type"
          id="select-type"
          value={type}
          label="Type"
          onChange={handleChangeType}
        >
          {documentTypes.map((doctype) => (
            <MenuItem value={doctype}>{doctype}</MenuItem>
          ))}
        </Select>
      </Stack>
      <Grid container alignItems="center">
        <Grid item xs={12}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <h2>Documents</h2>
          </Stack>
        </Grid>

        <DataGrid
          rows={allDocuments}
          getRowId={(row) => row.ID}
          columns={columns}
        />
      </Grid>
    </div>
  );
}

Index.layout = "adminDashBoard";
export default Index;
