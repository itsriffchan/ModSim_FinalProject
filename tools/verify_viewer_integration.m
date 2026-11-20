function verify_viewer_integration(root, prior, videoRoot)
%VERIFY_VIEWER_INTEGRATION Saved exports, scientific regression and video dispatch.
% root is a completed run_acceptance destination; prior is a saved A/B/C batch.
% videoRoot must be a fresh/empty destination for one legacy A run.
repo=fileparts(fileparts(mfilename('fullpath'))); addpath(repo,fullfile(repo,'src'),fullfile(repo,'tests'));
batch=fullfile(root,'batch');
before=science_hashes(batch);
for id={'A','B','C'}
    current=load(fullfile(batch,id{1},'state.mat'),'result');
    old=load(fullfile(prior,id{1},'state.mat'),'result');
    assert(isequaln(current.result.Tc,old.result.Tc) && isequaln(current.result.Lg,old.result.Lg));
end
fprintf('PASS scientific results unchanged against prior MATLAB A/B/C run\n');
export_scenario_viewer(batch); verify_viewer_payload(batch);
assert(isequal(before,science_hashes(batch)),'Saved export modified scientific state or tables');
single=fullfile(root,'independent_1_C');
export_scenario_viewer(single); verify_viewer_payload(single);
assert(isempty(dir(fullfile(root,'**','*.mp4'))) && isempty(dir(fullfile(root,'**','*.avi'))));
fprintf('PASS default acceptance creates no videos; saved export supports batch and independent C\n');
% A fresh explicit video runner exercises backward-compatible dispatch and codec checks.
[r,~]=run_scenario('A',videoRoot,'video');
assert(r.export.verified && r.export.decoded_frame_count==r.export.frame_count);
old=load(fullfile(prior,'A','state.mat'),'result');
assert(isequaln(r.Tc,old.result.Tc) && isequaln(r.Lg,old.result.Lg));
fprintf('PASS explicit video runner encodes/decodes all frames; scientific arrays unchanged\n');
end

function hashes=science_hashes(root)
    files=[dir(fullfile(root,'**','*.mat'));dir(fullfile(root,'**','*.csv'))]; hashes=cell(numel(files),2);
    for k=1:numel(files)
        filename=fullfile(files(k).folder,files(k).name);
        fid=fopen(filename,'rb'); assert(fid>=0); cleanup=onCleanup(@() fclose(fid));
        bytes=fread(fid,Inf,'*uint8'); clear cleanup;
        md=java.security.MessageDigest.getInstance('SHA-256'); md.update(typecast(bytes,'int8'));
        hash=lower(reshape(dec2hex(typecast(md.digest(),'uint8'),2)',1,[]));
        hashes(k,:)={filename,hash};
    end
    hashes=sortrows(hashes,1);
end
